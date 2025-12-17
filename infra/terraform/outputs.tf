output "device_service_app_id" {
  description = "Device Service App ID"
  value       = digitalocean_app.device_service.id
}

output "loan_service_app_id" {
  description = "Loan Service App ID"
  value       = digitalocean_app.loan_service.id
}

output "device_service_url" {
  description = "Device Service URL"
  value       = digitalocean_app.device_service.live_url
}

output "loan_service_url" {
  description = "Loan Service URL"
  value       = digitalocean_app.loan_service.live_url
}
