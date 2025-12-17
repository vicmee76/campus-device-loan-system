output "backend_app_id" {
  description = "Backend App Platform ID"
  value       = digitalocean_app.backend.id
}

output "backend_app_url" {
  description = "Backend App Platform URL"
  value       = digitalocean_app.backend.live_url
}

output "frontend_app_id" {
  description = "Frontend App Platform ID"
  value       = digitalocean_app.frontend.id
}

output "frontend_app_url" {
  description = "Frontend App Platform URL"
  value       = digitalocean_app.frontend.live_url
}

output "project_id" {
  description = "DigitalOcean Project ID"
  value       = local.project_id
}
