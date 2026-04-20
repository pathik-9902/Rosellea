<?php
require_once 'config.php';

try {
    $sql = file_get_contents('database.sql');
    $conn->exec($sql);
    echo "Database setup successful!";
} catch (PDOException $e) {
    echo "Error setting up database: " . $e->getMessage();
}
