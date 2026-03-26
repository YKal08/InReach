resource "helm_release" "argocd" {
  name             = "argocd"
  repository       = "https://argoproj.github.io/argo-helm"
  chart            = "argo-cd"
  version          = "7.8.13"
  namespace        = "argocd"
  create_namespace = true

  values = [
    yamlencode({
      server = {
        ingress = {
          enabled          = true
          ingressClassName = "alb"
          hostname         = var.argocd_hostname
          annotations = {
            "alb.ingress.kubernetes.io/scheme"           = "internet-facing"
            "alb.ingress.kubernetes.io/target-type"      = "ip"
            "alb.ingress.kubernetes.io/listen-ports"     = "[{\"HTTP\":80}]"
            "alb.ingress.kubernetes.io/backend-protocol" = "HTTP"
          }
          tls = false
        }
        extraArgs = ["--insecure"]
      }
    })
  ]

  depends_on = [module.eks, helm_release.aws_lb_controller]
}

resource "helm_release" "argocd_apps" {
  name             = "argocd-apps"
  repository       = "https://argoproj.github.io/argo-helm"
  chart            = "argocd-apps"
  version          = "2.0.2"
  namespace        = "argocd"
  create_namespace = false

  values = [
    file("${path.module}/templates/argocd-apps-values.yaml")
  ]

  depends_on = [helm_release.argocd]
}
