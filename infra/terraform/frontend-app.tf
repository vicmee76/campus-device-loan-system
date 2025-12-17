# Frontend App Platform - Separate Next.js application
resource "digitalocean_app" "frontend" {
  spec {
    name   = "campus-device-loan-frontend"
    region = var.region

    # Root path routing for frontend
    ingress {
      rule {
        match {
          path {
            prefix = "/"
          }
        }
        component {
          name = "frontend"
        }
      }
    }

    service {
      name               = "frontend"
      instance_count     = 1
      instance_size_slug = "basic-xxs"
      source_dir         = "frontend"

      github {
        repo           = var.github_repo_url
        branch         = "main"
        deploy_on_push = true
      }

      build_command = "npm install && npm run build"
      run_command   = "npm start"

      env {
        key   = "NODE_ENV"
        value = "production"
      }

      http_port = 8080

      health_check {
        http_path             = "/"
        initial_delay_seconds = 10
        period_seconds        = 10
        timeout_seconds       = 3
        success_threshold     = 1
        failure_threshold     = 3
      }
    }
  }
}
