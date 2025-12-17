resource "digitalocean_project" "main" {
  name        = "campus-device-loan-${var.environment}"
  description = "Campus Device Loan System - ${var.environment}"
  purpose     = "Web Application"
  environment = var.environment == "prod" ? "Production" : "Development"
}

locals {
  project_id = digitalocean_project.main.id
}
