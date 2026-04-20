<?php
session_start();
$_SESSION['user_role'] = 'admin'; // Mock admin login
$_SESSION['user_id'] = 1;

require_once 'config.php';
$action = 'get_seller_applications';

if ($action === 'get_seller_applications') {
    if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin') {
        echo "Unauthorized";
        exit();
    }
    $stmt = $conn->prepare("SELECT id, full_name, email, company_name, phone, created_at FROM users WHERE role = 'seller' AND user_status = 'pending'");
    $stmt->execute();
    $apps = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["status" => "success", "data" => $apps]);
}
