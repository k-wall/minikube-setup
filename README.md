# Minikube setup action

Action installs minikube to hosted VM environment.

## Inputs

### `minikube-version`

**Required** Minikube version. Default `"1.4.0"`.

### `k8s-version`

**Required** Version of Kubernetes you wish to use with Minikube. Default `"1.14.6"`.

## Example usage
```
- name: Minikube setup with registry
      uses: EnMasseProject/minikube-setup@v1.0.4
      with:
        k8s-version: 1.15.0
```