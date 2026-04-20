<?php
session_start();

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');

$host = '127.0.0.1';
$db_name = 'rosellea_db';
$username = 'root'; // DEFAULT XAMPP user
$password = 'root'; // DEFAULT XAMPP pass

try {
    $conn = new PDO("mysql:host=$host;dbname=$db_name", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // echo json_encode(["status" => "success", "message" => "Connected successfully"]);
} catch(PDOException $e) {
    // If database doesn't exist, we might want to tell the user politely or handle it.
    echo json_encode(["status" => "error", "message" => "Connection failed: " . $e->getMessage(), "hint" => "Please import database.sql into phpMyAdmin first."]);
    exit();
}
?>
