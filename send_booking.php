<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'PHPMailer/src/Exception.php';
require 'PHPMailer/src/PHPMailer.php';
require 'PHPMailer/src/SMTP.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = htmlspecialchars($_POST['name'] ?? '');
    $email = htmlspecialchars($_POST['email'] ?? '');
    $phone = htmlspecialchars($_POST['phone'] ?? '');
    $service = htmlspecialchars($_POST['service'] ?? 'Booking');
    $checkin = htmlspecialchars($_POST['checkin'] ?? '');
    $checkout = htmlspecialchars($_POST['checkout'] ?? '');
    $adults = htmlspecialchars($_POST['adults'] ?? '');
    $children = htmlspecialchars($_POST['children'] ?? '');
    $time = htmlspecialchars($_POST['time'] ?? '');
    $date = htmlspecialchars($_POST['date'] ?? '');
    $message = htmlspecialchars($_POST['message'] ?? '');

    // Create a new PHPMailer instance
    $mail = new PHPMailer(true);

    try {
        // SMTP Configuration
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'ashathdavid@gmail.com'; // 🔹 Your Gmail
        $mail->Password = 'ASHATHdavid1998.';   // 🔹 Use an App Password
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;

        // Email Content
        $mail->setFrom($email, $name);
        $mail->addAddress('ashathdavid@gmail.com'); // 🔹 Receive emails here
        $mail->addReplyTo($email, $name);

        $mail->isHTML(true);
        $mail->Subject = "New Booking Request from $name";

        $body  = "<h2>New Booking Request</h2>";
        $body .= "<p><strong>Name:</strong> $name</p>";
        $body .= "<p><strong>Email:</strong> $email</p>";
        $body .= "<p><strong>Phone:</strong> $phone</p>";
        if ($checkin)  $body .= "<p><strong>Check-In:</strong> $checkin</p>";
        if ($checkout) $body .= "<p><strong>Check-Out:</strong> $checkout</p>";
        if ($adults)   $body .= "<p><strong>Adults:</strong> $adults</p>";
        if ($children) $body .= "<p><strong>Children:</strong> $children</p>";
        if ($time)     $body .= "<p><strong>Time:</strong> $time</p>";
        $body .= "<p><strong>Service:</strong> $service</p>";
        if ($date)     $body .= "<p><strong>Preferred Date:</strong> $date</p>";
        if ($message)  $body .= "<p><strong>Additional Message:</strong> $message</p>";

        $mail->Body = $body;

        $mail->send();
        echo "<script>alert('Booking request sent successfully!');window.location.href='index.html';</script>";
    } catch (Exception $e) {
        echo "<script>alert('Booking failed: {$mail->ErrorInfo}');</script>";
    }
}
?>
