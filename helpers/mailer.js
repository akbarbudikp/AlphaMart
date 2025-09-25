// File: helpers/mailer.js

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendCheckoutEmail(userEmail, transaction) {
    try {
        console.log(`Mencoba mengirim email ke ${userEmail} via Resend...`);

        const { data, error } = await resend.emails.send({
            from: 'AlphaMart <onboarding@resend.dev>',
            to: userEmail,
            subject: `Konfirmasi Pesanan AlphaMart #${transaction.id}`,
            html: `
                <h1>Terima Kasih Telah Berbelanja di AlphaMart!</h1>
                <p>Halo ${userEmail} </p>
                <p>Pesanan Anda dengan nomor #${transaction.id} telah kami terima pada tanggal ${transaction.transactionDate.toLocaleDateString('id-ID')}.</p>
                <h3>Rincian Pesanan:</h3>
                <p><strong>Total Pembayaran:</strong> Rp ${transaction.totalPrice.toLocaleString('id-ID')}</p>
                <p><strong>Status:</strong> ${transaction.status}</p>
                <br>
                <p>Terima kasih,</p>
                <p>Tim AlphaMart</p>
            `
        });

        if (error) {
            return console.error({ error });
        }

        console.log("Email berhasil dikirim! ID Pesan:", data.id);

    } catch (error) {
        console.error(`Gagal total saat mencoba mengirim email via Resend:`, error);
    }
}

module.exports = { sendCheckoutEmail };