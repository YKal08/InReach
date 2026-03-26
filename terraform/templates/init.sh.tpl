#!/bin/bash
# Update and install dependencies
yum update -y
yum install -y curl git unzip wget

# Install Docker
yum install -y docker
systemctl start docker

# Install AWS SSM Agent
yum install -y amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent

# Helm
curl https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 | bash

# Kubectl
curl -LO https://storage.googleapis.com/kubernetes-release/release/`curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt`/bin/linux/amd64/kubectl
chmod +x ./kubectl
mv ./kubectl /usr/local/bin/kubectl

# AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install

# Install GitLab Runner
curl -L --output /usr/local/bin/gitlab-runner https://gitlab-runner-downloads.s3.amazonaws.com/latest/binaries/gitlab-runner-linux-amd64
chmod +x /usr/local/bin/gitlab-runner
useradd --comment 'GitLab Runner' --create-home gitlab-runner --shell /bin/bash
install -o gitlab-runner -g gitlab-runner -d /etc/gitlab-runner
gitlab-runner install --user=gitlab-runner --working-directory=/home/gitlab-runner

# Register GitLab Runner
gitlab-runner register \
  --non-interactive \
  --url "https://gitlab.itgix.com/" \
  --token ${gitlab_runner_registration_token} \
  --executor "docker" \
  --docker-image alpine:latest \
  --description "Observability Platform Runner" \
  --docker-privileged

# Start GitLab Runner
gitlab-runner start