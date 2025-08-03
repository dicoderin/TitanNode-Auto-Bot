require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const { HttpsProxyAgent } = require('https-proxy-agent');
const randomUseragent = require('random-useragent');

const colors = {
    reset: "\x1b[0m",
    cyan: "\x1b[36m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    white: "\x1b[37m",
    bold: "\x1b[1m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
};

const logger = {
    info: (msg) => console.log(`${colors.cyan}[i] ${msg}${colors.reset}`),
    warn: (msg) => console.log(`${colors.yellow}[⚠] ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}[✗] ${msg}${colors.reset}`),
    success: (msg) => console.log(`${colors.green}[✅] ${msg}${colors.reset}`),
    loading: (msg) => console.log(`${colors.cyan}[⟳] ${msg}${colors.reset}`),
    step: (msg) => console.log(`${colors.white}[➤] ${msg}${colors.reset}`),
    point: (msg) => console.log(`${colors.white}[💰] ${msg}${colors.reset}`),
    proxy: (msg) => console.log(`${colors.yellow}[🌐] ${msg}${colors.reset}`),
    banner: () => {
        console.log(`${colors.cyan}${colors.bold}`);
        console.log(`---------------------------------------------`);
        console.log(`   Titan Node Auto Bot - Airdrop Insiders   `);
        console.log(`---------------------------------------------${colors.reset}`);
        console.log();
    },
};

/**
 * Membaca daftar proxy dari file
 * @returns {string[]} Daftar proxy
 */
function readProxies() {
    const proxyFilePath = path.join(__dirname, 'proxies.txt');
    try {
        if (fs.existsSync(proxyFilePath)) {
            return fs.readFileSync(proxyFilePath, 'utf-8')
                .split('\n')
                .map(p => p.trim())
                .filter(p => p);
        }
    } catch (error) {
        logger.error(`Error reading proxies.txt: ${error.message}`);
    }
    return [];
}

/**
 * Membaca daftar akun dari file
 * @returns {string[]} Daftar refresh token
 */
function readAccounts() {
    const accountFilePath = path.join(__dirname, 'accounts.txt');
    try {
        if (fs.existsSync(accountFilePath)) {
            return fs.readFileSync(accountFilePath, 'utf-8')
                .split('\n')
                .map(a => a.trim())
                .filter(a => a);
        }
    } catch (error) {
        logger.error(`Error reading accounts.txt: ${error.message}`);
    }
    return [];
}

class TitanNode {
    constructor(refreshToken, proxy = null, accountIndex) {
        this.refreshToken = refreshToken;
        this.proxy = proxy;
        this.accountIndex = accountIndex;
        this.accessToken = null;
        this.userId = null;
        this.deviceId = uuidv4();
        this.isActive = true;

        const agent = this.proxy ? new HttpsProxyAgent(this.proxy) : null;

        this.api = axios.create({
            httpsAgent: agent,
            headers: {
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Content-Type': 'application/json',
                'User-Agent': randomUseragent.getRandom(),
            }
        });

        this.ws = null;
        this.reconnectInterval = 1000 * 60 * 5;
        this.pingInterval = null;
    }

    async refreshAccessToken() {
        logger.loading(`[Akun #${this.accountIndex}] Memperbarui token akses...`);
        try {
            const response = await this.api.post('https://task.titannet.info/api/auth/refresh-token', {
                refresh_token: this.refreshToken,
            });

            if (response.data && response.data.code === 0) {
                this.accessToken = response.data.data.access_token;
                this.userId = response.data.data.user_id;
                this.api.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`;
                logger.success(`[Akun #${this.accountIndex}] Token akses berhasil diperbarui!`);
                return true;
            } else {
                logger.error(`[Akun #${this.accountIndex}] Gagal memperbarui token: ${response.data.msg || 'Unknown error'}`);
                return false;
            }
        } catch (error) {
            logger.error(`[Akun #${this.accountIndex}] Error: ${error.message}`);
            return false;
        }
    }

    async registerNode() {
        logger.loading(`[Akun #${this.accountIndex}] Mendaftarkan node...`);
        try {
            const payload = {
                ext_version: "0.0.4",
                language: "en",
                user_script_enabled: true,
                device_id: this.deviceId,
                install_time: new Date().toISOString(),
            };
            const response = await this.api.post('https://task.titannet.info/api/webnodes/register', payload);

            if (response.data && response.data.code === 0) {
                logger.success(`[Akun #${this.accountIndex}] Node berhasil terdaftar`);
                logger.info(`[Akun #${this.accountIndex}] Poin Awal: ${JSON.stringify(response.data.data)}`);
            } else {
                logger.error(`[Akun #${this.accountIndex}] Pendaftaran gagal: ${response.data.msg || 'Unknown error'}`);
            }
        } catch (error) {
            logger.error(`[Akun #${this.accountIndex}] Error: ${error.message}`);
        }
    }

    connectWebSocket() {
        logger.loading(`[Akun #${this.accountIndex}] Menghubungkan WebSocket...`);
        const wsUrl = `wss://task.titannet.info/api/public/webnodes/ws?token=${this.accessToken}&device_id=${this.deviceId}`;
        
        const agent = this.proxy ? new HttpsProxyAgent(this.proxy) : null;

        this.ws = new WebSocket(wsUrl, {
            agent: agent,
            headers: {
                'User-Agent': this.api.defaults.headers['User-Agent'],
            }
        });

        this.ws.on('open', () => {
            logger.success(`[Akun #${this.accountIndex}] WebSocket terhubung. Menunggu pekerjaan...`);
            this.pingInterval = setInterval(() => {
                if (this.ws.readyState === WebSocket.OPEN) {
                    const echoMessage = JSON.stringify({ cmd: 1, echo: "echo me", jobReport: { cfgcnt: 2, jobcnt: 0 } });
                    this.ws.send(echoMessage);
                }
            }, 30 * 1000);
        });

        this.ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                if (message.cmd === 1) {
                    const response = { cmd: 2, echo: message.echo };
                    this.ws.send(JSON.stringify(response));
                }
                if (message.userDataUpdate) {
                    logger.point(`[Akun #${this.accountIndex}] Poin - Hari Ini: ${message.userDataUpdate.today_points}, Total: ${message.userDataUpdate.total_points}`);
                }
            } catch (error) {
                logger.warn(`[Akun #${this.accountIndex}] Pesan tidak valid: ${data}`);
            }
        });

        this.ws.on('error', (error) => {
            logger.error(`[Akun #${this.accountIndex}] WebSocket error: ${error.message}`);
            this.ws.close();
        });

        this.ws.on('close', () => {
            if (this.isActive) {
                logger.warn(`[Akun #${this.accountIndex}] WebSocket tertutup. Mencoba menghubungkan ulang...`);
                clearInterval(this.pingInterval);
                setTimeout(() => this.start(), this.reconnectInterval);
            }
        });
    }

    async start() {
        if (this.proxy) {
            logger.proxy(`[Akun #${this.accountIndex}] Menggunakan Proxy: ${this.proxy}`);
        } else {
            logger.proxy(`[Akun #${this.accountIndex}] Mode Direct (Tanpa Proxy)`);
        }
        logger.step(`[Akun #${this.accountIndex}] Device ID: ${this.deviceId}`);
        
        const tokenRefreshed = await this.refreshAccessToken();
        if (tokenRefreshed) {
            await this.registerNode();
            this.connectWebSocket();
        } else {
            logger.error(`[Akun #${this.accountIndex}] Gagal memulai bot`);
        }
    }

    stop() {
        this.isActive = false;
        if (this.ws) {
            this.ws.close();
        }
        clearInterval(this.pingInterval);
        logger.warn(`[Akun #${this.accountIndex}] Bot dihentikan`);
    }
}

function main() {
    logger.banner();

    const accounts = readAccounts();
    if (accounts.length === 0) {
        logger.error('Tidak ada akun di accounts.txt');
        logger.warn('Buat file accounts.txt dan isi dengan refresh token (satu token per baris)');
        return;
    }

    const proxies = readProxies();
    logger.info(`Ditemukan ${accounts.length} akun dan ${proxies.length} proxy`);

    const bots = [];
    
    accounts.forEach((account, index) => {
        const proxy = proxies.length > 0 
            ? proxies[index % proxies.length] 
            : null;
        
        setTimeout(() => {
            logger.step(`Memulai bot untuk akun #${index + 1}`);
            const bot = new TitanNode(account, proxy, index + 1);
            bots.push(bot);
            bot.start();
        }, index * 10000);
    });

    // Handle proses shutdown
    process.on('SIGINT', () => {
        logger.warn('\nMenghentikan semua bot...');
        bots.forEach(bot => bot.stop());
        setTimeout(() => process.exit(), 1000);
    });
}

main();
