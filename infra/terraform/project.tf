resource "digitalocean_project" "main" {
  name        = var.do_project_name
  description = "Campus device loan system"
  purpose     = "Web Application"
  environment = "Development"
}

# Attach resources to the project so they appear under one DO Project in the UI.
# Uses URNs provided by DO for each resource.
resource "digitalocean_project_resources" "main" {
  project = digitalocean_project.main.id

  resources = [
    digitalocean_app.device.urn,
    digitalocean_app.loan.urn,
    digitalocean_app.frontend.urn,
    digitalocean_database_cluster.postgres.urn,
  ]
}


