output "load_balancer_dns" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = aws_ecr_repository.app.repository_url
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "s3_bucket_name" {
  description = "Name of the S3 uploads bucket"
  value       = aws_s3_bucket.uploads.bucket
}

output "s3_bucket_url" {
  description = "URL of the S3 uploads bucket"
  value       = "https://${aws_s3_bucket.uploads.bucket}.s3.amazonaws.com"
}

output "rds_endpoint" {
  description = "RDS MySQL endpoint"
  value       = aws_db_instance.main.endpoint
}

output "rds_database_name" {
  description = "RDS database name"
  value       = aws_db_instance.main.db_name
}

output "certificate_arn" {
  description = "ARN of the SSL certificate"
  value       = var.domain_name != "" ? aws_acm_certificate.main[0].arn : null
}

output "certificate_validation_records" {
  description = "DNS validation records for the certificate"
  value       = var.domain_name != "" ? aws_acm_certificate.main[0].domain_validation_options : null
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain name (HTTPS enabled)"
  value       = var.domain_name == "" ? aws_cloudfront_distribution.main[0].domain_name : null
}

output "https_url" {
  description = "HTTPS URL for the application"
  value       = var.domain_name != "" ? "https://${var.domain_name}" : "https://${aws_cloudfront_distribution.main[0].domain_name}"
}
