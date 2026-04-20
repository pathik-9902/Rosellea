<?php
require_once 'config.php';

set_exception_handler(function($e) {
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    exit();
});

$action = isset($_GET['action']) ? $_GET['action'] : (isset($_POST['action']) ? $_POST['action'] : '');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'get_products') {
        $category = isset($_GET['category']) ? $_GET['category'] : '';
        $brand = isset($_GET['brand']) ? $_GET['brand'] : '';
        
        $sql = "SELECT * FROM products WHERE status = 'active'";
        $params = [];
        
        if (!empty($category)) {
            $sql .= " AND category = :category";
            $params[':category'] = $category;
        }
        if (!empty($brand)) {
            $sql .= " AND brand = :brand";
            $params[':brand'] = $brand;
        }
        
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(["status" => "success", "data" => $products]);
    } 
    elseif ($action === 'get_brands') {
        $stmt = $conn->prepare("SELECT DISTINCT brand FROM products");
        $stmt->execute();
        $brands = $stmt->fetchAll(PDO::FETCH_COLUMN);
        echo json_encode(["status" => "success", "data" => $brands]);
    }
    elseif ($action === 'get_categories') {
        $stmt = $conn->prepare("SELECT DISTINCT category FROM products");
        $stmt->execute();
        $categories = $stmt->fetchAll(PDO::FETCH_COLUMN);
        echo json_encode(["status" => "success", "data" => $categories]);
    }
    elseif ($action === 'get_user_orders') {
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(["status" => "error", "message" => "Not logged in."]);
            exit();
        }
        $user_id = $_SESSION['user_id'];
        $stmt = $conn->prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC");
        $stmt->execute([$user_id]);
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($orders as &$order) {
            $stmtItems = $conn->prepare("SELECT oi.*, p.name, p.image_url FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?");
            $stmtItems->execute([$order['id']]);
            $order['items'] = $stmtItems->fetchAll(PDO::FETCH_ASSOC);
        }
        
        echo json_encode(["status" => "success", "data" => $orders]);
    }
    elseif ($action === 'get_moderation_queue') {
        if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin') {
            echo json_encode(["status" => "error", "message" => "Unauthorized access."]);
            exit();
        }
        $stmt = $conn->prepare("SELECT p.*, u.full_name as seller_name FROM products p LEFT JOIN users u ON p.seller_id = u.id WHERE p.status = 'pending'");
        $stmt->execute();
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["status" => "success", "data" => $products]);
    }
    elseif ($action === 'get_stock_requests') {
        if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin') {
            echo json_encode(["status" => "error", "message" => "Admin access required."]);
            exit();
        }
        $stmt = $conn->prepare("SELECT sr.*, p.name as product_name, u.full_name as seller_name FROM stock_requests sr JOIN products p ON sr.product_id = p.id JOIN users u ON sr.seller_id = u.id WHERE sr.status = 'pending'");
        $stmt->execute();
        $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["status" => "success", "data" => $requests]);
    }
    elseif ($action === 'get_seller_applications') {
        if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin') {
            echo json_encode(["status" => "error", "message" => "Admin session required."]);
            exit();
        }
        $stmt = $conn->prepare("SELECT id, full_name, email, company_name, phone, created_at FROM users WHERE role = 'seller' AND user_status = 'pending'");
        $stmt->execute();
        $apps = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["status" => "success", "data" => $apps]);
    }
    elseif ($action === 'get_my_products') {
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(["status" => "error", "message" => "Login required."]);
            exit();
        }
        $user_id = $_SESSION['user_id'];
        $stmt = $conn->prepare("SELECT * FROM products WHERE seller_id = ?");
        $stmt->execute([$user_id]);
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["status" => "success", "data" => $products]);
    }
    elseif ($action === 'get_seller_profile') {
        if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'seller') {
            echo json_encode(["status" => "error", "message" => "Seller access required."]);
            exit();
        }
        $user_id = $_SESSION['user_id'];
        $stmt = $conn->prepare("SELECT full_name, email, company_name, company_description, phone FROM users WHERE id = ?");
        $stmt->execute([$user_id]);
        $profile = $stmt->fetch(PDO::FETCH_ASSOC);
                echo json_encode(["status" => "success", "data" => $profile]);
    }
    elseif ($action === 'check_auth') {
        if (isset($_SESSION['user_id'])) {
            echo json_encode([
                "status" => "success",
                "authenticated" => true,
                "user" => [
                    "id" => $_SESSION['user_id'],
                    "full_name" => $_SESSION['user_name'],
                    "email" => $_SESSION['user_email'],
                    "address" => $_SESSION['user_address'],
                    "role" => $_SESSION['user_role']
                ]
            ]);
        } else {
            echo json_encode(["status" => "success", "authenticated" => false]);
        }
    }
} 
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Handling JSON body
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    if (empty($action) && isset($data['action'])) {
        $action = $data['action'];
    }

    if ($action === 'add_product') {
        $data = $data ?? [];
        $name = $_POST['name'] ?? $data['name'] ?? '';
        $category = $_POST['category'] ?? $data['category'] ?? '';
        $brand = $_POST['brand'] ?? $data['brand'] ?? '';
        $price = $_POST['price'] ?? $data['price'] ?? 0;
        $description = $_POST['description'] ?? $data['description'] ?? '';
        
        $image_url = '';
        if (isset($_FILES['image_upload'])) {
            if ($_FILES['image_upload']['error'] === UPLOAD_ERR_OK) {
                $uploadDir = 'img/uploads/';
                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0755, true);
                }
                $fileName = time() . '_' . basename($_FILES['image_upload']['name']);
                $targetPath = $uploadDir . $fileName;
                if (move_uploaded_file($_FILES['image_upload']['tmp_name'], $targetPath)) {
                    $image_url = $targetPath;
                } else {
                    echo json_encode(["status" => "error", "message" => "Failed to move uploaded file. Check permissions."]);
                    exit();
                }
            } else if ($_FILES['image_upload']['error'] !== UPLOAD_ERR_NO_FILE) {
                echo json_encode(["status" => "error", "message" => "File upload error code: " . $_FILES['image_upload']['error']]);
                exit();
            }
        } else {
            $image_url = isset($_POST['image_url']) ? $_POST['image_url'] : (isset($data['image_url']) ? $data['image_url'] : '');
        }
        
        $user_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
        $role = isset($_SESSION['user_role']) ? $_SESSION['user_role'] : 'customer';
        
        // Admins can add active products, sellers add pending ones
        $status = ($role === 'admin') ? 'active' : 'pending';
        
        try {
            $stmt = $conn->prepare("INSERT INTO products (name, category, brand, price, image_url, description, status, seller_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$name, $category, $brand, $price, $image_url, $description, $status, $user_id]);
            echo json_encode(["status" => "success", "message" => "Product submitted for review.", "image" => $image_url]);
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        } catch (Exception $e) {
            echo json_encode(["status" => "error", "message" => "General error: " . $e->getMessage()]);
        }
    }
    elseif ($action === 'delete_product') {
        $id = $data['id'];
        $stmt = $conn->prepare("DELETE FROM products WHERE id = ?");
        if($stmt->execute([$id])){
            echo json_encode(["status" => "success", "message" => "Product deleted successfully"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to delete product"]);
        }
    }
    elseif ($action === 'update_stock') {
        $id = $data['id'];
        $in_stock = $data['in_stock'];
        $stmt = $conn->prepare("UPDATE products SET in_stock = ? WHERE id = ?");
        if($stmt->execute([$in_stock, $id])){
            echo json_encode(["status" => "success", "message" => "Stock status updated"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to update stock"]);
        }
    }
    elseif ($action === 'checkout') {
        // Mocking a checkout process
        $customer_name = $data['customer_name'];
        $address = $data['address'];
        $total_price = $data['total_price'];
        $items = $data['items']; // array of {id, quantity, price}
        $user_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;

        try {
            $conn->beginTransaction();
            
            $stmt = $conn->prepare("INSERT INTO orders (user_id, customer_name, address, total_price) VALUES (?, ?, ?, ?)");
            $stmt->execute([$user_id, $customer_name, $address, $total_price]);
            $order_id = $conn->lastInsertId();

            $stmtItem = $conn->prepare("INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)");
            foreach($items as $item) {
                $stmtItem->execute([$order_id, $item['id'], $item['quantity'], $item['price']]);
            }

            $conn->commit();
            echo json_encode(["status" => "success", "message" => "Order placed successfully!"]);
        } catch (Exception $e) {
            $conn->rollBack();
            echo json_encode(["status" => "error", "message" => "Order failed: " . $e->getMessage()]);
        }
    }
    elseif ($action === 'register') {
        $full_name = $data['full_name'];
        $email = $data['email'];
        $password = password_hash($data['password'], PASSWORD_DEFAULT);
        $address = isset($data['address']) ? $data['address'] : '';
        $role = isset($data['role']) ? $data['role'] : 'customer';
        
        // New seller fields
        $company_name = isset($data['company_name']) ? $data['company_name'] : null;
        $company_desc = isset($data['company_description']) ? $data['company_description'] : null;
        $phone = isset($data['phone']) ? $data['phone'] : null;
        
        // Sellers are pending by default, others are active
        $user_status = ($role === 'seller') ? 'pending' : 'active';

        try {
            $stmt = $conn->prepare("INSERT INTO users (full_name, email, password, address, role, user_status, company_name, company_description, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$full_name, $email, $password, $address, $role, $user_status, $company_name, $company_desc, $phone]);
            
            $msg = ($role === 'seller') ? "Registration successful! Your seller account is pending admin approval." : "Account created successfully!";
            echo json_encode(["status" => "success", "message" => $msg]);
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) {
                echo json_encode(["status" => "error", "message" => "Email already exists."]);
            } else {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
    }
    elseif ($action === 'login') {
        $email = $data['email'];
        $password = $data['password'];

        $stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && password_verify($password, $user['password'])) {
            if ($user['user_status'] === 'pending') {
                echo json_encode(["status" => "error", "message" => "Your account is pending approval."]);
                exit();
            }
            if ($user['user_status'] === 'rejected') {
                echo json_encode(["status" => "error", "message" => "Your account has been rejected."]);
                exit();
            }

            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_name'] = $user['full_name'];
            $_SESSION['user_email'] = $user['email'];
            $_SESSION['user_address'] = $user['address'];
            $_SESSION['user_role'] = $user['role'];
            
            echo json_encode([
                "status" => "success", 
                "message" => "Login successful!",
                "user" => [
                    "id" => $user['id'],
                    "full_name" => $user['full_name'],
                    "email" => $user['email'],
                    "address" => $user['address'],
                    "role" => $user['role']
                ]
            ]);
        } else {
            echo json_encode(["status" => "error", "message" => "Invalid email or password."]);
        }
    }
    elseif ($action === 'logout') {
        session_destroy();
        echo json_encode(["status" => "success", "message" => "Logged out successfully."]);
    }
    elseif ($action === 'check_auth') {
        if (isset($_SESSION['user_id'])) {
            echo json_encode([
                "status" => "success",
                "authenticated" => true,
                "user" => [
                    "id" => $_SESSION['user_id'],
                    "full_name" => $_SESSION['user_name'],
                    "email" => $_SESSION['user_email'],
                    "address" => $_SESSION['user_address'],
                    "role" => $_SESSION['user_role']
                ]
            ]);
        } else {
            echo json_encode(["status" => "success", "authenticated" => false]);
        }
    }
    elseif ($action === 'update_profile') {
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(["status" => "error", "message" => "Not logged in."]);
            exit();
        }
        $user_id = $_SESSION['user_id'];
        $full_name = $data['full_name'];
        $address = $data['address'];
        
        $stmt = $conn->prepare("UPDATE users SET full_name = ?, address = ? WHERE id = ?");
        if ($stmt->execute([$full_name, $address, $user_id])) {
            $_SESSION['user_name'] = $full_name;
            $_SESSION['user_address'] = $address;
            echo json_encode(["status" => "success", "message" => "Profile updated successfully!"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to update profile."]);
        }
    }
    elseif ($action === 'approve_product') {
        if ($_SESSION['user_role'] !== 'admin') {
            echo json_encode(["status" => "error", "message" => "Unauthorized."]);
            exit();
        }
        $id = $data['id'];
        $stmt = $conn->prepare("UPDATE products SET status = 'active' WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["status" => "success", "message" => "Product approved and live."]);
    }
    elseif ($action === 'reject_product') {
        if ($_SESSION['user_role'] !== 'admin') {
            echo json_encode(["status" => "error", "message" => "Unauthorized."]);
            exit();
        }
        $id = $data['id'];
        $stmt = $conn->prepare("UPDATE products SET status = 'rejected' WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["status" => "success", "message" => "Product rejected."]);
    }
    elseif ($action === 'request_stock') {
        $product_id = $data['product_id'];
        $quantity = $data['quantity'];
        $user_id = $_SESSION['user_id'];
        
        $stmt = $conn->prepare("INSERT INTO stock_requests (product_id, seller_id, requested_quantity) VALUES (?, ?, ?)");
        $stmt->execute([$product_id, $user_id, $quantity]);
        echo json_encode(["status" => "success", "message" => "Stock increase request submitted."]);
    }
    elseif ($action === 'approve_stock') {
        if ($_SESSION['user_role'] !== 'admin') exit();
        $request_id = $data['request_id'];
        
        $conn->beginTransaction();
        $stmt = $conn->prepare("SELECT * FROM stock_requests WHERE id = ?");
        $stmt->execute([$request_id]);
        $req = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($req) {
            $stmt = $conn->prepare("UPDATE products SET stock_quantity = stock_quantity + ?, in_stock = 1 WHERE id = ?");
            $stmt->execute([$req['requested_quantity'], $req['product_id']]);
            $stmt = $conn->prepare("UPDATE stock_requests SET status = 'approved' WHERE id = ?");
            $stmt->execute([$request_id]);
            $conn->commit();
            echo json_encode(["status" => "success", "message" => "Stock request approved."]);
        } else {
            $conn->rollBack();
            echo json_encode(["status" => "error", "message" => "Request not found."]);
        }
    }
    elseif ($action === 'instant_out_of_stock') {
        $product_id = $data['product_id'];
        $user_id = $_SESSION['user_id'];
        $stmt = $conn->prepare("UPDATE products SET stock_quantity = 0, in_stock = 0 WHERE id = ? AND seller_id = ?");
        $stmt->execute([$product_id, $user_id]);
        echo json_encode(["status" => "success", "message" => "Product marked as out of stock instantly."]);
    }
    elseif ($action === 'moderate_seller') {
        if ($_SESSION['user_role'] !== 'admin') exit();
        $user_id = $data['user_id'];
        $new_status = $data['status']; // 'active' or 'rejected'
        $stmt = $conn->prepare("UPDATE users SET user_status = ? WHERE id = ?");
        $stmt->execute([$new_status, $user_id]);
        echo json_encode(["status" => "success", "message" => "Seller account " . $new_status]);
    }
    elseif ($action === 'update_seller_profile') {
        if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'seller') {
            echo json_encode(["status" => "error", "message" => "Unauthorized."]);
            exit();
        }
        $user_id = $_SESSION['user_id'];
        $company_name = $data['company_name'];
        $company_desc = $data['company_description'];
        $phone = $data['phone'];

        $stmt = $conn->prepare("UPDATE users SET company_name = ?, company_description = ?, phone = ? WHERE id = ?");
        if ($stmt->execute([$company_name, $company_desc, $phone, $user_id])) {
            echo json_encode(["status" => "success", "message" => "Company profile updated successfully!"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to update company profile."]);
        }
    }
}
?>
