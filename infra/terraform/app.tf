resource "digitalocean_app" "device" {
  depends_on = [
    digitalocean_database_cluster.postgres
  ]

  spec {
    name   = var.device_app_name
    region = var.app_region

    service {
      name               = "device-service"
      instance_count     = 1
      instance_size_slug = "basic-xxs"

      github {
        repo           = var.github_repo
        branch         = var.github_branch
        deploy_on_push = var.deploy_on_push
      }

      source_dir    = "backend/device-service"
      build_command = "npm ci && npm run build"
      run_command   = "npm start"

      env {
        key   = "DATABASE_URL"
        value = local.database_url
        type  = "SECRET"
      }

      # Prefer IPv4 if DNS returns dualstack records (safety).
      env {
        key   = "NODE_OPTIONS"
        value = "--dns-result-order=ipv4first"
      }

      env {
        key   = "JWT_SECRET"
        value = var.jwt_secret
        type  = "SECRET"
      }

      env {
        key   = "JWT_EXPIRES_IN"
        value = var.jwt_expires_in
      }

      health_check {
        http_path = "/health"
      }
    }
  }
}

resource "digitalocean_app" "loan" {
  depends_on = [
    digitalocean_database_cluster.postgres
  ]

  spec {
    name   = var.loan_app_name
    region = var.app_region

    service {
      name               = "loan-service"
      instance_count     = 1
      instance_size_slug = "basic-xxs"

      github {
        repo           = var.github_repo
        branch         = var.github_branch
        deploy_on_push = var.deploy_on_push
      }

      source_dir    = "backend/loan-service"
      build_command = "npm ci && npm run build"
      run_command   = "npm start"

      env {
        key   = "DATABASE_URL"
        value = local.database_url
        type  = "SECRET"
      }

      # Prefer IPv4 if DNS returns dualstack records (safety).
      env {
        key   = "NODE_OPTIONS"
        value = "--dns-result-order=ipv4first"
      }

      env {
        key   = "JWT_SECRET"
        value = var.jwt_secret
        type  = "SECRET"
      }

      env {
        key   = "JWT_EXPIRES_IN"
        value = var.jwt_expires_in
      }

      health_check {
        http_path = "/health"
      }
    }
  }
}

resource "digitalocean_app" "frontend" {
  depends_on = [
    digitalocean_app.device,
    digitalocean_app.loan
  ]

  spec {
    name   = var.frontend_app_name
    region = var.app_region

    service {
      name               = "frontend"
      instance_count     = 1
      instance_size_slug = "basic-xxs"

      github {
        repo           = var.github_repo
        branch         = var.github_branch
        deploy_on_push = var.deploy_on_push
      }

      source_dir    = "frontend"
      build_command = "npm ci && npm run build"
      run_command   = "npm start"

      # These are the base URLs of the backend services once they are deployed.
      env {
        key   = "NEXT_PUBLIC_DEVICE_SERVICE_URL"
        value = digitalocean_app.device.default_ingress
      }

      env {
        key   = "NEXT_PUBLIC_LOAN_SERVICE_URL"
        value = digitalocean_app.loan.default_ingress
      }
    }
  }
}

