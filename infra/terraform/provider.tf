terraform {
  required_version = ">= 1.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 3.100"
    }
  }
}

provider "azurerm" {
  # Authentication methods (in order of precedence):
  # 1. Service Principal with Client Secret (use environment variables)
  #    - ARM_CLIENT_ID
  #    - ARM_CLIENT_SECRET
  #    - ARM_SUBSCRIPTION_ID
  #    - ARM_TENANT_ID
  #
  # 2. Service Principal with Client Certificate
  #    - ARM_CLIENT_ID
  #    - ARM_CLIENT_CERTIFICATE_PATH
  #    - ARM_SUBSCRIPTION_ID
  #    - ARM_TENANT_ID
  #
  # 3. Managed Service Identity (when running on Azure)
  #
  # 4. Azure CLI (requires 'az' command installed and logged in)
  #    Run: az login
  #    Set subscription: az account set --subscription <subscription-id>
  #    Get subscription ID: az account show --query id -o tsv

  # Subscription ID - if not provided, Terraform will try to use default from Azure CLI
  # You can also set via environment variable: export ARM_SUBSCRIPTION_ID="<id>"
  subscription_id = var.subscription_id

  features {
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
  }
}

