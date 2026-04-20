<?php
require_once 'config.php';
try {
    $stmt = $conn->query("SELECT id, full_name, email, role, user_status FROM users");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($users, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo $e->getMessage();
}
