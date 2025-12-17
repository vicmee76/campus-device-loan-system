terraform {
  required_version = ">= 1.0"

  # Local state backend (default)
  # Terraform state is stored locally in terraform.tfstate
  # This is acceptable for single-developer projects
  # Infrastructure is managed locally, not in CI/CD

  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

# DigitalOcean provider uses DIGITALOCEAN_TOKEN environment variable
# Set locally via: export DIGITALOCEAN_TOKEN="your-token"
# No Terraform variables needed for authentication
provider "digitalocean" {}
