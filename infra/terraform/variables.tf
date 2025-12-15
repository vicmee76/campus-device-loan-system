variable "subscription_id" {
  description = "Azure subscription ID (optional - will use default from Azure CLI if not provided)"
  type        = string
  default     = null
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "West Europe"
}

variable "resource_group_name" {
  description = "Name of the Azure Resource Group"
  type        = string
  default     = "campus-device-loan-rg"
}

variable "db_admin_user" {
  description = "PostgreSQL administrator username"
  type        = string
  sensitive   = true
}

variable "db_admin_password" {
  description = "PostgreSQL administrator password"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "Name of the PostgreSQL database"
  type        = string
  default     = "campus_device_loan"
}

variable "database_url" {
  description = "Full database connection URL (sensitive)"
  type        = string
  sensitive   = true
}



variable "cors_origin" {
  description = "CORS origin for API services (use * for all or specific domain)"
  type        = string
  default     = "*"
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "Campus Device Loan System"
    ManagedBy   = "Terraform"
    Environment = "dev"
  }
}

