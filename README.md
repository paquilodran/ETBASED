AQUI TIENES EL SCRIPT DE CARGA 


--------------------

BEGIN
    EXECUTE IMMEDIATE 'DROP VIEW vw_campaign_effectiveness CASCADE CONSTRAINTS';
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'DROP VIEW vw_churn_risk_customers CASCADE CONSTRAINTS';
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'DROP VIEW vw_customer_activity_summary CASCADE CONSTRAINTS';
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'DROP VIEW vw_customer_financial_summary CASCADE CONSTRAINTS';
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE alerts_recommendations CASCADE CONSTRAINTS';
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE product_interactions CASCADE CONSTRAINTS';
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE products_services CASCADE CONSTRAINTS';
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE support_interactions CASCADE CONSTRAINTS';
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE commercial_documents CASCADE CONSTRAINTS';
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE customer_activity_log CASCADE CONSTRAINTS';
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE marketing_campaigns CASCADE CONSTRAINTS';
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE customer_plans CASCADE CONSTRAINTS';
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE employees CASCADE CONSTRAINTS';
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE customers CASCADE CONSTRAINTS';
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

COMMIT;

-- ============================================
-- PASO 2: CREAR TABLAS PRINCIPALES
-- ============================================

-- 1. TABLA DE CLIENTES
CREATE TABLE customers (
    customer_id VARCHAR2(10) PRIMARY KEY,
    first_name VARCHAR2(50) NOT NULL,
    last_name VARCHAR2(50) NOT NULL,
    email VARCHAR2(100) UNIQUE NOT NULL,
    phone VARCHAR2(20),
    registration_date DATE DEFAULT SYSDATE NOT NULL,
    status VARCHAR2(20) DEFAULT 'active' NOT NULL,
    segment VARCHAR2(30),
    address VARCHAR2(200),
    city VARCHAR2(50),
    country VARCHAR2(50) DEFAULT 'Chile',
    CONSTRAINT chk_customer_status CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
    CONSTRAINT chk_customer_segment CHECK (segment IN ('basic', 'premium', 'vip', 'corporate', 'none'))
);

-- 2. TABLA DE EMPLEADOS
CREATE TABLE employees (
    employee_id VARCHAR2(10) PRIMARY KEY,
    first_name VARCHAR2(50) NOT NULL,
    last_name VARCHAR2(50) NOT NULL,
    email VARCHAR2(100) UNIQUE NOT NULL,
    department VARCHAR2(50) NOT NULL,
    position VARCHAR2(50) NOT NULL,
    hire_date DATE NOT NULL,
    status VARCHAR2(20) DEFAULT 'active' NOT NULL,
    manager_id VARCHAR2(10),
    CONSTRAINT chk_employee_status CHECK (status IN ('active', 'inactive', 'vacation', 'leave')),
    CONSTRAINT fk_employee_manager FOREIGN KEY (manager_id) REFERENCES employees(employee_id)
);

-- 3. TABLA DE PLANES DE CLIENTES
CREATE TABLE customer_plans (
    plan_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id VARCHAR2(10) NOT NULL,
    plan_name VARCHAR2(50) NOT NULL,
    plan_type VARCHAR2(30) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    monthly_fee NUMBER(10,2) NOT NULL,
    status VARCHAR2(20) DEFAULT 'active' NOT NULL,
    CONSTRAINT fk_plan_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    CONSTRAINT chk_plan_type CHECK (plan_type IN ('individual', 'family', 'corporate', 'premium', 'basic')),
    CONSTRAINT chk_plan_status CHECK (status IN ('active', 'cancelled', 'suspended', 'pending', 'expired'))
);

-- 4. TABLA DE CAMPAÑAS DE MARKETING
CREATE TABLE marketing_campaigns (
    campaign_id VARCHAR2(20) PRIMARY KEY,
    campaign_name VARCHAR2(100) NOT NULL,
    campaign_type VARCHAR2(30) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    target_segment VARCHAR2(30),
    budget NUMBER(15,2),
    status VARCHAR2(20) DEFAULT 'active' NOT NULL,
    responsible_employee VARCHAR2(10),
    CONSTRAINT fk_campaign_employee FOREIGN KEY (responsible_employee) REFERENCES employees(employee_id),
    CONSTRAINT chk_campaign_type CHECK (campaign_type IN ('email', 'sms', 'social', 'direct', 'web', 'mobile')),
    CONSTRAINT chk_campaign_status CHECK (status IN ('active', 'completed', 'cancelled', 'planned', 'paused'))
);

-- 5. TABLA DE PRODUCTOS/SERVICIOS
CREATE TABLE products_services (
    product_id VARCHAR2(20) PRIMARY KEY,
    product_name VARCHAR2(100) NOT NULL,
    product_type VARCHAR2(30) NOT NULL,
    description VARCHAR2(500),
    base_price NUMBER(15,2) NOT NULL,
    category VARCHAR2(50),
    status VARCHAR2(20) DEFAULT 'active' NOT NULL,
    stock_quantity NUMBER DEFAULT 0,
    CONSTRAINT chk_product_type CHECK (product_type IN ('plan', 'service', 'equipment', 'accessory', 'software')),
    CONSTRAINT chk_product_status CHECK (status IN ('active', 'discontinued', 'coming_soon', 'out_of_stock'))
);

-- 6. TABLA PRINCIPAL DE ACTIVIDADES DE CLIENTES
CREATE TABLE customer_activity_log (
    activity_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id VARCHAR2(10) NOT NULL,
    action VARCHAR2(50) NOT NULL,
    category VARCHAR2(30) NOT NULL,
    session_id VARCHAR2(50),
    activity_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ip_address VARCHAR2(45),
    user_agent VARCHAR2(500),
    device_type VARCHAR2(30),
    location VARCHAR2(100),
    metadata CLOB,
    related_campaign VARCHAR2(20),
    related_employee VARCHAR2(10),
    related_plan NUMBER,
    related_document VARCHAR2(50),
    CONSTRAINT fk_activity_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    CONSTRAINT fk_activity_campaign FOREIGN KEY (related_campaign) REFERENCES marketing_campaigns(campaign_id),
    CONSTRAINT fk_activity_employee FOREIGN KEY (related_employee) REFERENCES employees(employee_id),
    CONSTRAINT fk_activity_plan FOREIGN KEY (related_plan) REFERENCES customer_plans(plan_id),
    CONSTRAINT chk_activity_category CHECK (category IN (
        'auth', 'security', 'crm', 'sales', 'interaction', 
        'marketing', 'algorithm', 'support', 'billing', 'configuration'
    )),
    CONSTRAINT chk_device_type CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown'))
);

-- 7. TABLA DE DOCUMENTOS COMERCIALES
CREATE TABLE commercial_documents (
    document_id VARCHAR2(20) PRIMARY KEY,
    customer_id VARCHAR2(10) NOT NULL,
    document_type VARCHAR2(20) NOT NULL,
    document_number VARCHAR2(50) UNIQUE NOT NULL,
    issue_date DATE NOT NULL,
    amount NUMBER(15,2) NOT NULL,
    tax_amount NUMBER(15,2),
    total_amount NUMBER(15,2) NOT NULL,
    status VARCHAR2(20) DEFAULT 'issued' NOT NULL,
    seller_employee VARCHAR2(10) NOT NULL,
    payment_method VARCHAR2(30),
    related_plan NUMBER,
    CONSTRAINT fk_doc_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    CONSTRAINT fk_doc_employee FOREIGN KEY (seller_employee) REFERENCES employees(employee_id),
    CONSTRAINT fk_doc_plan FOREIGN KEY (related_plan) REFERENCES customer_plans(plan_id),
    CONSTRAINT chk_doc_type CHECK (document_type IN ('invoice', 'receipt', 'credit_note', 'debit_note', 'quotation')),
    CONSTRAINT chk_doc_status CHECK (status IN ('issued', 'paid', 'pending', 'cancelled', 'void')),
    CONSTRAINT chk_payment_method CHECK (payment_method IN ('cash', 'credit_card', 'debit_card', 'transfer', 'check', 'digital_wallet'))
);

-- 8. TABLA DE INTERACCIONES DE SOPORTE
CREATE TABLE support_interactions (
    interaction_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id VARCHAR2(10) NOT NULL,
    employee_id VARCHAR2(10) NOT NULL,
    interaction_type VARCHAR2(30) NOT NULL,
    channel VARCHAR2(30) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration_minutes NUMBER(6,2),
    topic VARCHAR2(100) NOT NULL,
    priority VARCHAR2(20) DEFAULT 'medium' NOT NULL,
    status VARCHAR2(20) DEFAULT 'open' NOT NULL,
    resolution VARCHAR2(500),
    CONSTRAINT fk_support_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    CONSTRAINT fk_support_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id),
    CONSTRAINT chk_support_type CHECK (interaction_type IN ('call', 'email', 'chat', 'meeting', 'follow_up')),
    CONSTRAINT chk_support_channel CHECK (channel IN ('phone', 'web', 'app', 'in_person', 'email', 'social')),
    CONSTRAINT chk_support_priority CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    CONSTRAINT chk_support_status CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'pending'))
);

-- 9. TABLA DE INTERACCIONES CON PRODUCTOS
CREATE TABLE product_interactions (
    interaction_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id VARCHAR2(10) NOT NULL,
    product_id VARCHAR2(20) NOT NULL,
    activity_id NUMBER NOT NULL,
    interaction_type VARCHAR2(30) NOT NULL,
    interaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    duration_seconds NUMBER(8),
    interest_level NUMBER(3),
    metadata CLOB,
    CONSTRAINT fk_prodint_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    CONSTRAINT fk_prodint_product FOREIGN KEY (product_id) REFERENCES products_services(product_id),
    CONSTRAINT fk_prodint_activity FOREIGN KEY (activity_id) REFERENCES customer_activity_log(activity_id),
    CONSTRAINT chk_prodint_type CHECK (interaction_type IN ('view', 'click', 'add_to_cart', 'compare', 'review', 'purchase', 'wishlist')),
    CONSTRAINT chk_interest_level CHECK (interest_level BETWEEN 0 AND 100)
);

-- 10. TABLA DE ALERTAS Y RECOMENDACIONES
CREATE TABLE alerts_recommendations (
    alert_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id VARCHAR2(10) NOT NULL,
    alert_type VARCHAR2(30) NOT NULL,
    alert_level VARCHAR2(20) NOT NULL,
    description VARCHAR2(500) NOT NULL,
    generated_by VARCHAR2(50) NOT NULL,
    generation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status VARCHAR2(20) DEFAULT 'new' NOT NULL,
    assigned_to VARCHAR2(10),
    resolution_date TIMESTAMP,
    resolution_notes VARCHAR2(1000),
    CONSTRAINT fk_alert_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    CONSTRAINT fk_alert_assigned FOREIGN KEY (assigned_to) REFERENCES employees(employee_id),
    CONSTRAINT chk_alert_type CHECK (alert_type IN ('churn_risk', 'upsell_opportunity', 'security', 'support', 'billing', 'engagement', 'compliance')),
    CONSTRAINT chk_alert_level CHECK (alert_level IN ('info', 'warning', 'critical', 'opportunity')),
    CONSTRAINT chk_alert_status CHECK (status IN ('new', 'assigned', 'in_progress', 'resolved', 'closed', 'dismissed'))
);

COMMIT;

-- ============================================
-- PASO 3: CREAR ÍNDICES
-- ============================================
CREATE INDEX idx_activity_customer ON customer_activity_log(customer_id, activity_date);
CREATE INDEX idx_activity_category ON customer_activity_log(category, activity_date);
CREATE INDEX idx_activity_session ON customer_activity_log(session_id);
CREATE INDEX idx_documents_customer ON commercial_documents(customer_id, issue_date);
CREATE INDEX idx_support_customer ON support_interactions(customer_id, start_time);
CREATE INDEX idx_plans_customer ON customer_plans(customer_id, status);
CREATE INDEX idx_product_interactions ON product_interactions(customer_id, product_id);
CREATE INDEX idx_alerts_customer ON alerts_recommendations(customer_id, status, alert_level);
CREATE INDEX idx_campaign_dates ON marketing_campaigns(start_date, end_date, status);
-- NO CREAR idx_customer_email porque ya existe UNIQUE constraint en email
CREATE INDEX idx_employee_department ON employees(department, status);

COMMIT;

-- ============================================
-- PASO 4: INSERTAR DATOS DE EJEMPLO
-- ============================================

-- Insertar clientes
INSERT INTO customers (customer_id, first_name, last_name, email, phone, registration_date, status, segment, city) VALUES
('CLT001', 'Juan', 'Pérez', 'juan.perez@email.com', '+56912345678', DATE '2024-01-15', 'active', 'premium', 'Santiago');
INSERT INTO customers (customer_id, first_name, last_name, email, phone, registration_date, status, segment, city) VALUES
('CLT002', 'María', 'González', 'maria.gonzalez@email.com', '+56987654321', DATE '2024-02-20', 'active', 'vip', 'Valparaíso');
INSERT INTO customers (customer_id, first_name, last_name, email, phone, registration_date, status, segment, city) VALUES
('CLT003', 'Carlos', 'Rodríguez', 'carlos.rodriguez@email.com', '+56911223344', DATE '2024-03-10', 'active', 'corporate', 'Concepción');
INSERT INTO customers (customer_id, first_name, last_name, email, phone, registration_date, status, segment, city) VALUES
('CLT004', 'Ana', 'Martínez', 'ana.martinez@email.com', '+56955667788', DATE '2024-01-05', 'active', 'basic', 'Santiago');
INSERT INTO customers (customer_id, first_name, last_name, email, phone, registration_date, status, segment, city) VALUES
('CLT005', 'Pedro', 'Sánchez', 'pedro.sanchez@email.com', '+56999887766', DATE '2024-02-28', 'inactive', 'basic', 'Antofagasta');

COMMIT;

-- Insertar empleados
INSERT INTO employees (employee_id, first_name, last_name, email, department, position, hire_date, status) VALUES
('EMP001', 'Laura', 'Silva', 'laura.silva@empresa.com', 'Sales', 'Sales Executive', DATE '2023-01-15', 'active');
INSERT INTO employees (employee_id, first_name, last_name, email, department, position, hire_date, status) VALUES
('EMP002', 'Carlos', 'Pérez', 'carlos.perez@empresa.com', 'Sales', 'Sales Manager', DATE '2022-03-10', 'active');
INSERT INTO employees (employee_id, first_name, last_name, email, department, position, hire_date, status) VALUES
('EMP003', 'María', 'Torres', 'maria.torres@empresa.com', 'Support', 'Support Supervisor', DATE '2023-06-20', 'active');
INSERT INTO employees (employee_id, first_name, last_name, email, department, position, hire_date, status) VALUES
('EMP004', 'Roberto', 'López', 'roberto.lopez@empresa.com', 'Marketing', 'Marketing Analyst', DATE '2024-01-10', 'active');
INSERT INTO employees (employee_id, first_name, last_name, email, department, position, hire_date, status) VALUES
('EMP005', 'Andrea', 'Castro', 'andrea.castro@empresa.com', 'IT', 'Systems Administrator', DATE '2022-11-05', 'active');

COMMIT;

-- Insertar planes de clientes
INSERT INTO customer_plans (customer_id, plan_name, plan_type, start_date, end_date, monthly_fee, status) VALUES
('CLT001', 'Premium Plus', 'premium', DATE '2024-01-20', DATE '2025-01-19', 49990, 'active');
INSERT INTO customer_plans (customer_id, plan_name, plan_type, start_date, end_date, monthly_fee, status) VALUES
('CLT002', 'VIP Corporate', 'corporate', DATE '2024-02-25', DATE '2025-02-24', 129990, 'active');
INSERT INTO customer_plans (customer_id, plan_name, plan_type, start_date, end_date, monthly_fee, status) VALUES
('CLT003', 'Corporate Pro', 'corporate', DATE '2024-03-15', DATE '2025-03-14', 89990, 'active');
INSERT INTO customer_plans (customer_id, plan_name, plan_type, start_date, end_date, monthly_fee, status) VALUES
('CLT004', 'Basic Plan', 'basic', DATE '2024-01-10', DATE '2024-12-31', 19990, 'active');
INSERT INTO customer_plans (customer_id, plan_name, plan_type, start_date, end_date, monthly_fee, status) VALUES
('CLT005', 'Family Plan', 'family', DATE '2024-03-01', DATE '2024-08-31', 29990, 'cancelled');

COMMIT;

-- Insertar campañas de marketing
INSERT INTO marketing_campaigns (campaign_id, campaign_name, campaign_type, start_date, end_date, target_segment, budget, status, responsible_employee) VALUES
('CAMP001', 'CyberDay 2025', 'web', DATE '2025-01-01', DATE '2025-01-31', 'premium', 5000000, 'completed', 'EMP004');
INSERT INTO marketing_campaigns (campaign_id, campaign_name, campaign_type, start_date, end_date, target_segment, budget, status, responsible_employee) VALUES
('CAMP002', 'Premium Upgrade 2x1', 'email', DATE '2025-02-01', DATE '2025-02-28', 'basic', 2500000, 'active', 'EMP004');
INSERT INTO marketing_campaigns (campaign_id, campaign_name, campaign_type, start_date, end_date, target_segment, budget, status, responsible_employee) VALUES
('CAMP003', 'VIP Loyalty Program', 'direct', DATE '2025-01-15', DATE '2025-03-15', 'vip', 3500000, 'active', 'EMP004');

COMMIT;

-- Insertar productos/servicios
INSERT INTO products_services (product_id, product_name, product_type, description, base_price, category, status, stock_quantity) VALUES
('PROD001', 'Premium Plus Plan', 'plan', 'Premium internet plan with 500 Mbps speed', 49990, 'internet', 'active', NULL);
INSERT INTO products_services (product_id, product_name, product_type, description, base_price, category, status, stock_quantity) VALUES
('PROD002', 'Pro Max Router', 'equipment', 'Latest generation WiFi 6 router', 129990, 'equipment', 'active', 50);
INSERT INTO products_services (product_id, product_name, product_type, description, base_price, category, status, stock_quantity) VALUES
('PROD003', 'Home Premium Plan', 'plan', 'Complete home plan with TV and phone', 69990, 'home', 'active', NULL);
INSERT INTO products_services (product_id, product_name, product_type, description, base_price, category, status, stock_quantity) VALUES
('PROD004', '24/7 Premium Support', 'service', 'Priority technical support 24/7', 9990, 'support', 'active', NULL);

COMMIT;

-- Insertar documentos comerciales
INSERT INTO commercial_documents (document_id, customer_id, document_type, document_number, issue_date, amount, tax_amount, total_amount, status, seller_employee, payment_method, related_plan) VALUES
('DOC001', 'CLT001', 'invoice', 'FAC-000122', DATE '2025-01-18', 25000, 4750, 29750, 'paid', 'EMP002', 'credit_card', 1);
INSERT INTO commercial_documents (document_id, customer_id, document_type, document_number, issue_date, amount, tax_amount, total_amount, status, seller_employee, payment_method, related_plan) VALUES
('DOC002', 'CLT002', 'invoice', 'FAC-000233', DATE '2025-01-18', 129000, 24510, 153510, 'paid', 'EMP001', 'transfer', 2);
INSERT INTO commercial_documents (document_id, customer_id, document_type, document_number, issue_date, amount, tax_amount, total_amount, status, seller_employee, payment_method, related_plan) VALUES
('DOC003', 'CLT003', 'receipt', 'BLT-000155', DATE '2025-01-19', 30000, 5700, 35700, 'pending', 'EMP001', 'cash', 3);

COMMIT;

-- ============================================
-- PASO 5: INSERTAR ACTIVIDADES DE CLIENTES (20 registros iniciales)
-- ============================================

INSERT INTO customer_activity_log (customer_id, action, category, session_id, activity_date, ip_address, device_type, metadata) VALUES
('CLT001', 'login_success', 'auth', 'SESS001', TIMESTAMP '2025-01-10 08:00:00', '192.168.1.10', 'desktop', '{"device": "Windows 10", "browser": "Chrome"}');

INSERT INTO customer_activity_log (customer_id, action, category, session_id, activity_date, ip_address, device_type, metadata) VALUES
('CLT001', 'login_failed', 'auth', 'SESS001', TIMESTAMP '2025-01-10 08:05:00', '192.168.1.10', 'desktop', '{"reason": "Incorrect password"}');

INSERT INTO customer_activity_log (customer_id, action, category, session_id, activity_date, ip_address, device_type, metadata) VALUES
('CLT002', 'password_change', 'security', 'SESS002', TIMESTAMP '2025-01-12 14:22:00', '10.0.0.55', 'mobile', '{}');

INSERT INTO customer_activity_log (customer_id, action, category, session_id, activity_date, ip_address, device_type, metadata) VALUES
('CLT003', 'token_expired', 'security', 'SESS003', TIMESTAMP '2025-01-12 16:00:00', '10.0.0.22', 'desktop', '{}');

INSERT INTO customer_activity_log (customer_id, action, category, session_id, activity_date, ip_address, device_type, metadata) VALUES
('CLT001', 'login_success', 'auth', 'SESS004', TIMESTAMP '2025-01-15 09:30:00', '192.168.1.10', 'mobile', '{"device": "Android", "browser": "Chrome Mobile"}');

INSERT INTO customer_activity_log (customer_id, action, category, session_id, activity_date, ip_address, device_type, metadata, related_employee) VALUES
('CLT001', 'crm_activity', 'crm', 'SESS005', TIMESTAMP '2025-01-13 10:00:00', '192.168.1.10', 'desktop', '{"type": "call", "description": "Customer requests information about new plans."}', 'EMP003');

INSERT INTO customer_activity_log (customer_id, action, category, session_id, activity_date, ip_address, device_type, metadata, related_employee) VALUES
('CLT002', 'crm_activity', 'crm', 'SESS006', TIMESTAMP '2025-01-14 15:45:00', '10.0.0.55', 'desktop', '{"type": "meeting", "result": "Interested in premium upgrade"}', 'EMP002');

INSERT INTO customer_activity_log (customer_id, action, category, session_id, activity_date, ip_address, device_type, metadata, related_employee) VALUES
('CLT003', 'crm_activity', 'crm', 'SESS007', TIMESTAMP '2025-01-15 11:30:00', '10.0.0.22', 'desktop', '{"type": "follow_up", "description": "Pending to send quotation"}', 'EMP001');

INSERT INTO customer_activity_log (customer_id, action, category, session_id, activity_date, ip_address, device_type, metadata, related_document) VALUES
('CLT001', 'document_issued', 'sales', 'SESS008', TIMESTAMP '2025-01-18 12:20:00', '192.168.1.10', 'desktop', '{"type": "receipt", "amount": 25000}', 'DOC001');

INSERT INTO customer_activity_log (customer_id, action, category, session_id, activity_date, ip_address, device_type, metadata, related_document) VALUES
('CLT002', 'document_issued', 'sales', 'SESS009', TIMESTAMP '2025-01-18 12:30:00', '10.0.0.55', 'desktop', '{"type": "invoice", "amount": 129000}', 'DOC002');

INSERT INTO customer_activity_log (customer_id, action, category, session_id, activity_date, ip_address, device_type, metadata, related_document) VALUES
('CLT003', 'document_issued', 'sales', 'SESS010', TIMESTAMP '2025-01-19 09:00:00', '10.0.0.22', 'desktop', '{"type": "receipt", "amount": 30000}', 'DOC003');

INSERT INTO customer_activity_log (customer_id, action, category, session_id, activity_date, ip_address, device_type, metadata) VALUES
('CLT001', 'view_plan', 'interaction', 'SESS011', TIMESTAMP '2025-01-20 08:10:00', '192.168.1.10', 'desktop', '{"planId": "PLAN_PREMIUM_01"}');

INSERT INTO customer_activity_log (customer_id, action, category, session_id, activity_date, ip_address, device_type, metadata) VALUES
('CLT002', 'view_dashboard', 'interaction', 'SESS012', TIMESTAMP '2025-01-21 09:30:00', '10.0.0.55', 'desktop', '{"section": "statistics"}');

INSERT INTO customer_activity_log (customer_id, action, category, session_id, activity_date, ip_address, device_type, metadata) VALUES
('CLT003', 'add_to_cart', 'interaction', 'SESS013', TIMESTAMP '2025-01-21 10:00:00', '10.0.0.22', 'desktop', '{"product": "Premium Upgrade", "price": 45000}');

INSERT INTO customer_activity_log (customer_id, action, category, session_id, activity_date, ip_address, device_type, metadata) VALUES
('CLT002', 'login_failed', 'auth', 'SESS014', TIMESTAMP '2025-01-22 07:45:00', '10.0.0.55', 'mobile', '{"attempts": 2}');

INSERT INTO customer_activity_log (customer_id, action, category, session_id, activity_date, ip_address, device_type, metadata) VALUES
('CLT003', 'password_change', 'security', 'SESS015', TIMESTAMP '2025-01-22 14:00:00', '172.168.0.20', 'desktop', '{}');

INSERT INTO customer_activity_log (customer_id, action, category, session_id, activity_date, ip_address, device_type, metadata) VALUES
('CLT001', 'token_expired', 'security', 'SESS016', TIMESTAMP '2025-01-23 07:00:00', '192.168.1.10', 'mobile', '{}');

INSERT INTO customer_activity_log (customer_id, action, category, session_id, activity_date, ip_address, device_type, metadata, related_employee) VALUES
('CLT002', 'crm_activity', 'crm', 'SESS017', TIMESTAMP '2025-01-23 16:00:00', '10.0.0.55', 'desktop', '{"type": "email", "description": "Sending commercial proposal"}', 'EMP002');

INSERT INTO customer_activity_log (customer_id, action, category, session_id, activity_date, ip_address, device_type, metadata, related_campaign) VALUES
('CLT001', 'view_campaign', 'marketing', 'SESS018', TIMESTAMP '2025-02-02 08:12:00', '192.168.1.10', 'desktop', '{"campaign": "Summer Discount", "interest": 70}', 'CAMP001');

INSERT INTO customer_activity_log (customer_id, action, category, session_id, activity_date, ip_address, device_type, metadata, related_campaign) VALUES
('CLT002', 'view_campaign', 'marketing', 'SESS019', TIMESTAMP '2025-02-02 08:20:00', '10.0.0.55', 'desktop', '{"campaign": "Premium Plan 2x1", "interest": 85}', 'CAMP002');

COMMIT;

-- ============================================
-- PASO 6: INSERTAR DATOS ADICIONALES EN OTRAS TABLAS
-- ============================================

-- Insertar interacciones de soporte
INSERT INTO support_interactions (customer_id, employee_id, interaction_type, channel, start_time, end_time, duration_minutes, topic, priority, status, resolution) VALUES
('CLT001', 'EMP003', 'call', 'phone', TIMESTAMP '2025-01-25 10:00:00', TIMESTAMP '2025-01-25 10:15:00', 15, 'Technical issue with router', 'medium', 'resolved', 'Router reset and working properly');

INSERT INTO support_interactions (customer_id, employee_id, interaction_type, channel, start_time, end_time, duration_minutes, topic, priority, status) VALUES
('CLT002', 'EMP003', 'email', 'email', TIMESTAMP '2025-01-26 14:30:00', NULL, NULL, 'Billing inquiry', 'low', 'in_progress');

COMMIT;

-- Insertar interacciones con productos
INSERT INTO product_interactions (customer_id, product_id, activity_id, interaction_type, interaction_date, duration_seconds, interest_level, metadata) VALUES
('CLT001', 'PROD002', 18, 'view', TIMESTAMP '2025-02-02 08:12:00', 120, 70, '{"campaign": "CAMP001"}');

INSERT INTO product_interactions (customer_id, product_id, activity_id, interaction_type, interaction_date, duration_seconds, interest_level, metadata) VALUES
('CLT002', 'PROD001', 19, 'view', TIMESTAMP '2025-02-02 08:20:00', 180, 85, '{"campaign": "CAMP002"}');

COMMIT;

-- Insertar alertas
INSERT INTO alerts_recommendations (customer_id, alert_type, alert_level, description, generated_by, generation_date, status, assigned_to) VALUES
('CLT005', 'churn_risk', 'critical', 'Customer inactive for 60+ days, plan cancelled', 'system', TIMESTAMP '2025-03-01 09:00:00', 'new', 'EMP001');

INSERT INTO alerts_recommendations (customer_id, alert_type, alert_level, description, generated_by, generation_date, status, assigned_to) VALUES
('CLT001', 'upsell_opportunity', 'opportunity', 'High interest in premium products detected', 'algorithm', TIMESTAMP '2025-02-03 10:30:00', 'assigned', 'EMP002');

COMMIT;

-- ============================================
-- PASO 7: CREAR VISTAS ÚTILES (CORREGIDAS)
-- ============================================

-- Vista 1: Resumen de actividades por cliente (CORREGIDA)
CREATE OR REPLACE VIEW vw_customer_activity_summary AS
SELECT 
    c.customer_id,
    c.first_name || ' ' || c.last_name as customer_name,
    c.segment,
    c.status as customer_status,
    cp.plan_name,
    COUNT(DISTINCT cal.session_id) as total_sessions,
    COUNT(cal.activity_id) as total_activities,
    MIN(CAST(cal.activity_date AS DATE)) as first_activity,
    MAX(CAST(cal.activity_date AS DATE)) as last_activity,
    COUNT(DISTINCT cal.category) as unique_categories,
    ROUND(SYSDATE - MAX(CAST(cal.activity_date AS DATE)), 1) as days_since_last_activity
FROM customers c
LEFT JOIN customer_plans cp ON c.customer_id = cp.customer_id AND cp.status = 'active'
LEFT JOIN customer_activity_log cal ON c.customer_id = cal.customer_id
GROUP BY c.customer_id, c.first_name, c.last_name, c.segment, c.status, cp.plan_name;

-- Vista 2: Actividades de marketing por campaña
CREATE OR REPLACE VIEW vw_campaign_effectiveness AS
SELECT 
    mc.campaign_id,
    mc.campaign_name,
    mc.campaign_type,
    mc.status as campaign_status,
    COUNT(DISTINCT cal.customer_id) as unique_customers,
    COUNT(cal.activity_id) as total_interactions,
    COUNT(DISTINCT CASE WHEN cal.action LIKE '%purchase%' THEN cal.customer_id END) as converted_customers,
    ROUND(COUNT(DISTINCT CASE WHEN cal.action LIKE '%purchase%' THEN cal.customer_id END) * 100.0 / 
          NULLIF(COUNT(DISTINCT cal.customer_id), 0), 2) as conversion_rate_percent
FROM marketing_campaigns mc
LEFT JOIN customer_activity_log cal ON mc.campaign_id = cal.related_campaign
GROUP BY mc.campaign_id, mc.campaign_name, mc.campaign_type, mc.status;

-- Vista 3: Clientes con riesgo de churn (CORREGIDA)
CREATE OR REPLACE VIEW vw_churn_risk_customers AS
SELECT 
    c.customer_id,
    c.first_name || ' ' || c.last_name as customer_name,
    c.segment,
    c.status as customer_status,
    cp.plan_name,
    cp.monthly_fee,
    MAX(CAST(cal.activity_date AS DATE)) as last_activity_date,
    ROUND(SYSDATE - MAX(CAST(cal.activity_date AS DATE)), 1) as days_inactive,
    COUNT(CASE WHEN cal.action = 'login_failed' THEN 1 END) as failed_logins_last_30d,
    CASE 
        WHEN ROUND(SYSDATE - MAX(CAST(cal.activity_date AS DATE)), 1) > 60 THEN 'HIGH'
        WHEN ROUND(SYSDATE - MAX(CAST(cal.activity_date AS DATE)), 1) > 30 THEN 'MEDIUM'
        ELSE 'LOW'
    END as churn_risk_level
FROM customers c
JOIN customer_plans cp ON c.customer_id = cp.customer_id AND cp.status = 'active'
LEFT JOIN customer_activity_log cal ON c.customer_id = cal.customer_id
    AND CAST(cal.activity_date AS DATE) >= SYSDATE - 90
WHERE c.status = 'active'
GROUP BY c.customer_id, c.first_name, c.last_name, c.segment, c.status, cp.plan_name, cp.monthly_fee
HAVING ROUND(SYSDATE - MAX(CAST(cal.activity_date AS DATE)), 1) > 15;

-- Vista 4: Resumen financiero por cliente
CREATE OR REPLACE VIEW vw_customer_financial_summary AS
SELECT 
    c.customer_id,
    c.first_name || ' ' || c.last_name as customer_name,
    c.segment,
    cp.plan_name,
    cp.monthly_fee,
    NVL(SUM(cd.total_amount), 0) as total_spent,
    COUNT(cd.document_id) as total_transactions,
    ROUND(AVG(cd.total_amount), 2) as avg_transaction_amount,
    MIN(cd.issue_date) as first_purchase_date,
    MAX(cd.issue_date) as last_purchase_date
FROM customers c
LEFT JOIN customer_plans cp ON c.customer_id = cp.customer_id AND cp.status = 'active'
LEFT JOIN commercial_documents cd ON c.customer_id = cd.customer_id AND cd.status = 'paid'
GROUP BY c.customer_id, c.first_name, c.last_name, c.segment, cp.plan_name, cp.monthly_fee;

COMMIT;

-- ============================================
-- PASO 8: CONSULTAS DE VERIFICACIÓN (CORREGIDAS)
-- ============================================

-- Verificar conteo de registros (CORREGIDA - sin ORDER BY)
SELECT 'Customers' as table_name, COUNT(*) as record_count FROM customers
UNION ALL
SELECT 'Employees', COUNT(*) FROM employees
UNION ALL
SELECT 'Customer Plans', COUNT(*) FROM customer_plans
UNION ALL
SELECT 'Marketing Campaigns', COUNT(*) FROM marketing_campaigns
UNION ALL
SELECT 'Products/Services', COUNT(*) FROM products_services
UNION ALL
SELECT 'Customer Activity Log', COUNT(*) FROM customer_activity_log
UNION ALL
SELECT 'Commercial Documents', COUNT(*) FROM commercial_documents
UNION ALL
SELECT 'Support Interactions', COUNT(*) FROM support_interactions
UNION ALL
SELECT 'Product Interactions', COUNT(*) FROM product_interactions
UNION ALL
SELECT 'Alerts/Recommendations', COUNT(*) FROM alerts_recommendations;

-- Consulta de actividades recientes
SELECT 
    cal.activity_id,
    cal.activity_date,
    c.first_name || ' ' || c.last_name as customer,
    cal.action,
    cal.category,
    cal.device_type,
    mc.campaign_name
FROM customer_activity_log cal
JOIN customers c ON cal.customer_id = c.customer_id
LEFT JOIN marketing_campaigns mc ON cal.related_campaign = mc.campaign_id
ORDER BY cal.activity_date DESC
FETCH FIRST 10 ROWS ONLY;

-- Consulta de relaciones de cliente
SELECT 
    c.customer_id,
    c.first_name || ' ' || c.last_name as customer_name,
    cp.plan_name,
    cp.status as plan_status,
    COUNT(DISTINCT cal.activity_id) as total_activities,
    COUNT(DISTINCT cd.document_id) as total_documents,
    COUNT(DISTINCT si.interaction_id) as total_support_calls
FROM customers c
LEFT JOIN customer_plans cp ON c.customer_id = cp.customer_id
LEFT JOIN customer_activity_log cal ON c.customer_id = cal.customer_id
LEFT JOIN commercial_documents cd ON c.customer_id = cd.customer_id
LEFT JOIN support_interactions si ON c.customer_id = si.customer_id
GROUP BY c.customer_id, c.first_name, c.last_name, cp.plan_name, cp.status
ORDER BY c.customer_id;

-- Verificar integridad de relaciones
SELECT 
    'Activity Log -> Customers' as relationship,
    COUNT(*) as total,
    SUM(CASE WHEN c.customer_id IS NULL THEN 1 ELSE 0 END) as broken_links
FROM customer_activity_log cal
LEFT JOIN customers c ON cal.customer_id = c.customer_id
UNION ALL
SELECT 
    'Activity Log -> Campaigns',
    COUNT(*),
    SUM(CASE WHEN mc.campaign_id IS NULL AND cal.related_campaign IS NOT NULL THEN 1 ELSE 0 END)
FROM customer_activity_log cal
LEFT JOIN marketing_campaigns mc ON cal.related_campaign = mc.campaign_id
UNION ALL
SELECT 
    'Documents -> Customers',
    COUNT(*),
    SUM(CASE WHEN c.customer_id IS NULL THEN 1 ELSE 0 END)
FROM commercial_documents cd
LEFT JOIN customers c ON cd.customer_id = c.customer_id;

COMMIT;

-- ============================================
-- PASO 9: MOSTRAR ESTRUCTURA FINAL
-- ============================================
SELECT 'ESQUEMA CREADO EXITOSAMENTE' as message FROM dual;
SELECT 'Total de tablas creadas: 10' as info FROM dual;
SELECT 'Total de vistas creadas: 4' as info FROM dual;
SELECT 'Total de índices creados: 10' as info FROM dual;
SELECT 'Datos de ejemplo insertados' as info FROM dual;


