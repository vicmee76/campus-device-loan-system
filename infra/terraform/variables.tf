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

variable "database_url" {
  description = "Supabase PostgreSQL connection string"
  type        = string
  sensitive   = true
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
