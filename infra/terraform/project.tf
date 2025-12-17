data "digitalocean_project" "existing" {
  name = "campus-device-loan-${var.environment}"
}

resource "digitalocean_project" "main" {
  count       = var.create_project ? 1 : 0
  name        = "campus-device-loan-${var.environment}"
  description = "Campus Device Loan System - ${var.environment}"
  purpose     = "Web Application"
  environment = var.environment == "prod" ? "Production" : "Development"
}

locals {
  project_id = var.create_project ? digitalocean_project.main[0].id : data.digitalocean_project.existing.id
}
