<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');


$recipientEmail = 'hello@novaperformance.agency';

$siteName = 'NOVA Performance';


function respond(bool $success, string $message, int $status = 200): never
{
    http_response_code($status);

    echo json_encode(
        [
            'success' => $success,
            'message' => $message
        ],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );

    exit;
}


function cleanText(?string $value): string
{
    $value = trim((string) $value);

    $value = strip_tags($value);

    return preg_replace('/\s+/u', ' ', $value) ?? '';
}


function cleanMessage(?string $value): string
{
    $value = trim((string) $value);

    return strip_tags($value);
}


function safeLength(string $value): int
{
    if (function_exists('mb_strlen')) {
        return mb_strlen($value, 'UTF-8');
    }

    return strlen($value);
}


function validEmail(string $email): bool
{
    if (
        str_contains($email, "\r") ||
        str_contains($email, "\n")
    ) {
        return false;
    }

    return filter_var(
        $email,
        FILTER_VALIDATE_EMAIL
    ) !== false;
}


if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(
        false,
        'Method not allowed.',
        405
    );
}


$honeypot = trim(
    (string) ($_POST['website_check'] ?? '')
);

if ($honeypot !== '') {
    respond(
        true,
        'Successfully sent!'
    );
}


$name = cleanText(
    $_POST['name'] ?? ''
);

$company = cleanText(
    $_POST['company'] ?? ''
);

$email = cleanText(
    $_POST['email'] ?? ''
);

$website = cleanText(
    $_POST['website'] ?? ''
);

$businessType = cleanText(
    $_POST['business_type'] ?? ''
);

$budget = cleanText(
    $_POST['budget'] ?? ''
);

$service = cleanText(
    $_POST['service'] ?? ''
);

$message = cleanMessage(
    $_POST['message'] ?? ''
);


if ($name === '') {
    respond(
        false,
        'Please enter your name.',
        422
    );
}

if (
    safeLength($name) < 2 ||
    safeLength($name) > 100
) {
    respond(
        false,
        'Please enter a valid name.',
        422
    );
}


if ($email === '') {
    respond(
        false,
        'Please enter your business email.',
        422
    );
}

if (!validEmail($email)) {
    respond(
        false,
        'Please enter a valid email address.',
        422
    );
}


if (
    safeLength($company) > 150 ||
    safeLength($website) > 250 ||
    safeLength($businessType) > 100 ||
    safeLength($budget) > 100 ||
    safeLength($service) > 150
) {
    respond(
        false,
        'One or more fields are too long.',
        422
    );
}


if (
    $message !== '' &&
    safeLength($message) > 3000
) {
    respond(
        false,
        'Your message is too long.',
        422
    );
}


if ($website !== '') {

    if (
        !preg_match(
            '~^https?://~i',
            $website
        )
    ) {
        $website = 'https://' . $website;
    }

    if (
        filter_var(
            $website,
            FILTER_VALIDATE_URL
        ) === false
    ) {
        respond(
            false,
            'Please enter a valid website address.',
            422
        );
    }
}


$subject = sprintf(
    'New Google Ads audit request — %s',
    $siteName
);

$lines = [
    'NEW WEBSITE ENQUIRY',
    '==============================',
    '',
    'Name: ' . ($name ?: 'Not provided'),
    'Company: ' . ($company ?: 'Not provided'),
    'Business Email: ' . ($email ?: 'Not provided'),
    'Website: ' . ($website ?: 'Not provided'),
    'Business Type: ' . ($businessType ?: 'Not provided'),
    'Monthly Advertising Budget: ' . ($budget ?: 'Not provided'),
    'Service Required: ' . ($service ?: 'Not provided'),
    '',
    'Message:',
    $message ?: 'Not provided',
    '',
    '==============================',
    'Submitted: ' . date('Y-m-d H:i:s'),
];

$emailBody = implode(
    PHP_EOL,
    $lines
);


$host = $_SERVER['HTTP_HOST'] ?? 'localhost';

$host = preg_replace(
    '/[^a-zA-Z0-9.-]/',
    '',
    $host
) ?: 'localhost';

$fromEmail =
    'website@' . $host;

$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'From: ' . $siteName . ' <' . $fromEmail . '>',
    'Reply-To: ' . $email,
    'X-Mailer: PHP/' . phpversion()
];


$sent = @mail(
    $recipientEmail,
    $subject,
    $emailBody,
    implode("\r\n", $headers)
);


if (!$sent) {
    respond(
        false,
        'Unable to send your request right now. Please try again.',
        500
    );
}


respond(
    true,
    'Successfully sent!'
);
