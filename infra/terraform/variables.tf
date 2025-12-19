variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "device_app_name" {
  description = "Name of the DigitalOcean App for device-service"
  type        = string
  default     = "device-service-dev"
}

variable "loan_app_name" {
  description = "Name of the DigitalOcean App for loan-service"
  type        = string
  default     = "loan-service-dev"
}

variable "frontend_app_name" {
  description = "Name of the DigitalOcean App for the frontend"
  type        = string
  default     = "campus-frontend-dev"
}

variable "region" {
  description = "DigitalOcean region"
  type        = string
  default     = "nyc"
}

variable "db_cluster_name" {
  description = "Name of the DigitalOcean managed Postgres cluster"
  type        = string
  default     = "campus-device-loan-dev-db"
}

variable "db_name" {
  description = "Database name to create inside the cluster"
  type        = string
  default     = "campus_device_loan"
}

variable "db_user" {
  description = "Application database user to create"
  type        = string
  default     = "appuser"
}

variable "db_size" {
  description = "DigitalOcean managed database size slug (cheapest is typically db-s-1vcpu-1gb)"
  type        = string
  default     = "db-s-1vcpu-1gb"
}

variable "db_node_count" {
  description = "Number of nodes (keep 1 for cheapest)"
  type        = number
  default     = 1
}

variable "db_engine_version" {
  description = "PostgreSQL major version (optional)"
  type        = string
  default     = "16"
}

variable "db_allow_public_access" {
  description = "If true, opens the DB firewall to the public internet (dev-only). Required for GitHub Actions runners + App Platform to connect without VPC plumbing."
  type        = bool
  default     = true
}

variable "jwt_secret" {
  description = "JWT signing secret for backend services"
  type        = string
  sensitive   = true
}

variable "jwt_expires_in" {
  description = "JWT expiration (e.g. 1h, 7d)"
  type        = string
}

variable "github_repo" {
  description = "GitHub repo in the format owner/repo (used by DigitalOcean App Platform Git integration)"
  type        = string
}

variable "github_branch" {
  description = "Git branch to build from"
  type        = string
  default     = "main"
}

variable "deploy_on_push" {
  description = "If true, DigitalOcean auto-deploys on every push. Keep false to let GitHub Actions control deployments."
  type        = bool
  default     = false
}
