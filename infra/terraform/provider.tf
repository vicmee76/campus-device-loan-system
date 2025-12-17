terraform {
  required_version = ">= 1.0"

  # Remote state backend: Terraform Cloud
  # This ensures state is shared between local development and CI/CD
  # State is stored remotely, preventing "resource already exists" errors
  cloud {
    organization = "vdn-org"  # Replace with your Terraform Cloud organization name
    workspaces {
      name = "production"
    }
  }

  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

# DigitalOcean provider uses DIGITALOCEAN_TOKEN environment variable
# This is set in GitHub Actions secrets and locally via export
provider "digitalocean" {}
