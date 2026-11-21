-- SUMEXORA PENAL - Core Schema
-- PostgreSQL 16

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Admin Users
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'administrator',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hosting Plans
CREATE TABLE hosting_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    storage_limit_mb INTEGER NOT NULL DEFAULT 1024,
    project_limit INTEGER NOT NULL DEFAULT 5,
    bandwidth_limit_gb INTEGER,
    domain_limit INTEGER DEFAULT 5,
    deployment_limit INTEGER DEFAULT 50,
    duration_days INTEGER NOT NULL DEFAULT 30,
    features JSONB DEFAULT '[]',
    price_cents INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES hosting_plans(id),
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, expiring, expired, suspended
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    auto_renew BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    project_type VARCHAR(50) NOT NULL DEFAULT 'static', -- static, node, react, etc.
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, active, deploying, live, archived, failed
    storage_path TEXT,
    storage_used_bytes BIGINT DEFAULT 0,
    current_version INTEGER DEFAULT 1,
    framework VARCHAR(100),
    build_command TEXT,
    start_command TEXT,
    environment_vars JSONB DEFAULT '{}',
    connection_status VARCHAR(50) DEFAULT 'disconnected',
    is_connected BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(admin_user_id, slug)
);

-- Domains
CREATE TABLE domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    hostname VARCHAR(255) UNIQUE NOT NULL,
    domain_type VARCHAR(50) NOT NULL DEFAULT 'branded', -- branded, custom
    is_primary BOOLEAN DEFAULT false,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, verifying, active, expiring, expired, suspended
    ssl_status VARCHAR(50) DEFAULT 'pending', -- pending, issuing, active, failed, expired
    ssl_expires_at TIMESTAMPTZ,
    verification_token VARCHAR(255),
    verified_at TIMESTAMPTZ,
    activated_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    auto_renew BOOLEAN DEFAULT true,
    dns_records JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deployments
CREATE TABLE deployments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'queued', -- queued, building, deploying, live, failed, cancelled
    provider VARCHAR(100),
    provider_deployment_id VARCHAR(255),
    public_url TEXT,
    build_logs TEXT,
    deploy_logs TEXT,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Versions / Backups
CREATE TABLE project_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    size_bytes BIGINT,
    change_summary TEXT,
    created_by UUID REFERENCES admin_users(id),
    is_backup BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, version)
);

-- Hosting Provider Connections
CREATE TABLE hosting_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
    provider VARCHAR(100) NOT NULL, -- render, cloudflare, github
    name VARCHAR(255) NOT NULL,
    credentials_encrypted TEXT, -- encrypted JSON
    status VARCHAR(50) DEFAULT 'connected',
    metadata JSONB DEFAULT '{}',
    last_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Operations
CREATE TABLE ai_operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    admin_user_id UUID REFERENCES admin_users(id),
    instruction TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, analyzing, proposing, approved, applied, rejected, failed
    proposed_changes JSONB,
    applied_files JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID REFERENCES admin_users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_projects_admin ON projects(admin_user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_domains_hostname ON domains(hostname);
CREATE INDEX idx_domains_project ON domains(project_id);
CREATE INDEX idx_domains_status ON domains(status);
CREATE INDEX idx_deployments_project ON deployments(project_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(admin_user_id);
CREATE INDEX idx_ai_operations_project ON ai_operations(project_id);

-- Seed default plan
INSERT INTO hosting_plans (name, slug, storage_limit_mb, project_limit, domain_limit, duration_days, features)
VALUES 
('Free', 'free', 512, 3, 2, 14, '["basic_hosting", "branded_domains"]'),
('Professional', 'professional', 5120, 20, 15, 30, '["basic_hosting", "branded_domains", "custom_domains", "ai_commands", "backups"]'),
('Enterprise', 'enterprise', 51200, 100, 50, 365, '["all"]');
