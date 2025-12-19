terraform {
  required_version = ">= 1.0"

  # Remote state (Option A): Terraform Cloud
  # Backend settings (organization/workspace) are provided at init-time via
  # `-backend-config=backend.hcl` in GitHub Actions.
  #
  # Why empty here? Terraform backends do not accept variables, so we keep config out of repo.
  backend "remote" {}

  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}
