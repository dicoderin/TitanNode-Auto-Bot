# TitanNode Auto Bot


Bot otomatis untuk Titan Network Node yang mendukung multi-akun dengan sistem rotasi proxy. Dikembangkan untuk mempermudah pengelolaan node Titan Network secara efisien.

## Fitur Utama

- ✅ **Multi-Akun Support** - Jalankan puluhan akun sekaligus
- 🔁 **Proxy Rotation** - Dukungan penuh rotasi proxy
- 💰 **Poin Otomatis** - Kumpulkan poin Titan secara otomatis
- 📊 **Real-time Monitoring** - Pantau poin secara real-time
- 🔐 **Auto Reconnect** - Sistem reconnection otomatis
- 📈 **Scalable** - Dukungan untuk ratusan akun

## Prasyarat

- Node.js v16+
- NPM/Yarn
- Akun Titan Network
- Proxy (opsional)

## Instalasi

1. Clone repositori ini:
```bash
git clone https://github.com/dicoderin/TitanNode-Auto-Bot.git
cd TitanNode-Auto-Bot
```

2. Install dependencies:
```bash
npm install
```

3. Buat file konfigurasi:
```bash
cp .env.example .env
```

4. Isi file `accounts.txt` dengan refresh token Anda

## Konfigurasi

### 1. File Akun (`accounts.txt`)
Buat file `accounts.txt` di root direktori, isi dengan refresh token Titan Network (satu token per baris):
```
refresh_token_akun_1
refresh_token_akun_2
refresh_token_akun_3
```

### 2. File Proxy (`proxies.txt`)
Opsional: Untuk menggunakan proxy, buat file `proxies.txt` dengan format:
```
http://user:pass@ip:port
socks5://ip:port
http://ip:port
```

### 3. Environment Variables (`.env`)
Konfigurasi opsional di file `.env`:
```env
# Log level (verbose, debug, info, warn, error)
LOG_LEVEL=info

# Interval reconnection (dalam milidetik)
RECONNECT_INTERVAL=300000
```

## Penggunaan

Jalankan bot:
```bash
node index.js
```

### Perintah Tambahan
- **Mulai semua akun**: `node index.js`
- **Hentikan bot**: Tekan `Ctrl+C`

## Struktur Log
```
---------------------------------------------
   Titan Node Auto Bot - Airdrop Insiders   
---------------------------------------------

[i] Ditemukan 5 akun dan 3 proxy
[➤] Memulai bot untuk akun #1
[🌐] [Akun #1] Menggunakan Proxy: http://103.149.162.1:8000
[➤] [Akun #1] Device ID: 7b5e3a8f-12d4-4e8c-a9f2-3b7c6d9e0f1a
[⟳] [Akun #1] Memperbarui token akses...
[✅] [Akun #1] Token akses berhasil diperbarui!
[⟳] [Akun #1] Mendaftarkan node...
[✅] [Akun #1] Node berhasil terdaftar
[i] [Akun #1] Poin Awal: {"today_points":0,"total_points":0}
[⟳] [Akun #1] Menghubungkan WebSocket...
[✅] [Akun #1] WebSocket terhubung. Menunggu pekerjaan...
[💰] [Akun #1] Poin - Hari Ini: 15, Total: 150
```

## FAQ

### Q: Bagaimana cara mendapatkan refresh token?
A: 
1. Login ke dashboard Titan Network
2. Buka developer tools (F12)
3. Cari request ke endpoint `api/auth/login`
4. Salin nilai `refresh_token` dari response

### Q: Apakah bot ini aman digunakan?
A: Bot ini menggunakan API resmi Titan Network dengan metode yang sama seperti aplikasi resmi. Namun gunakan dengan risiko sendiri.

### Q: Berapa banyak akun yang bisa dijalankan?
A: Secara teknis tidak ada batasan, tetapi disarankan maksimal 50 akun per server dengan spesifikasi menengah.

## Berkontribusi

Pull request dipersilakan! Untuk perubahan besar, buka issue terlebih dahulu untuk mendiskusikan perubahan yang ingin Anda buat.

1. Fork project
2. Buat branch fitur (`git checkout -b fitur/namafitur`)
3. Commit perubahan (`git commit -m 'Tambahkan fitur'`)
4. Push ke branch (`git push origin fitur/namafitur`)
5. Buka Pull Request
