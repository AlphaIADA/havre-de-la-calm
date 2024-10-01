<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php'; // Autoload PHPMailer

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Collect form data
    $name = $_POST['name'];
    $email = $_POST['email'];
    $phone = $_POST['phone'];
    $service = $_POST['service'];
    $date = $_POST['date'];
    $message = $_POST['message'];

    // Initialize PHPMailer
    $mail = new PHPMailer(true);

    try {
        // SMTP configuration
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com'; // Gmail SMTP server
        $mail->SMTPAuth   = true;
        $mail->Username   = 'ashathdavid@gmail.com'; // Your Gmail address
        $mail->Password   = 'ASHATHdavid1998.';  // Your Gmail password (or app password if 2FA is enabled)
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;

        // Sender and recipient settings
        $mail->setFrom($email, $name);
        $mail->addAddress('your_gmail@gmail.com'); // Your Gmail address to receive booking info
        $mail->addReplyTo($email, $name);

        // Email content
        $mail->isHTML(true);
        $mail->Subject = 'New Booking from Havre De La Calme Website';
        $mail->Body    = "
            <h2>New Client Booking</h2>
            <p><strong>Name:</strong> $name</p>
            <p><strong>Email:</strong> $email</p>
            <p><strong>Phone:</strong> $phone</p>
            <p><strong>Service:</strong> $service</p>
            <p><strong>Preferred Date:</strong> $date</p>
            <p><strong>Message:</strong> $message</p>
        ";

        // Send email
        $mail->send();
        echo 'Thank you for your booking. We will get back to you shortly.';
    } catch (Exception $e) {
        echo "There was an error sending your booking: {$mail->ErrorInfo}";
    }
}
?>
