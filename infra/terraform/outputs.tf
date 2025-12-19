output "app_id" {
  description = "ID of the frontend DigitalOcean App"
  value       = digitalocean_app.frontend.id
}

output "app_url" {
  description = "URL of the frontend DigitalOcean App"
  value       = digitalocean_app.frontend.default_ingress
}

output "device_service_url" {
  description = "URL of the device-service"
  value       = digitalocean_app.device.default_ingress
}

output "loan_service_url" {
  description = "URL of the loan-service"
  value       = digitalocean_app.loan.default_ingress
}

output "frontend_url" {
  description = "URL of the frontend"
  value       = digitalocean_app.frontend.default_ingress
}

output "database_url" {
  description = "DigitalOcean Postgres connection string for the app user (use for migrations and services)"
  value       = local.database_url
  sensitive   = true
}

output "database_host" {
  description = "Database host"
  value       = digitalocean_database_cluster.postgres.host
}
