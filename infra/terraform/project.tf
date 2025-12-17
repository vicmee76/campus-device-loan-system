resource "digitalocean_project" "main" {
  name        = "campus-device-loan"
  description = "Campus Device Loan System"
  purpose     = "Web Application"
  environment = "Production"
}

locals {
  project_id = digitalocean_project.main.id
}
