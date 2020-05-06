const core = require('@actions/core');
const { spawnSync } = require('child_process');

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }
  

function execute_command(command, args) {
    core.info(`Run ${command} ${args}`);
    var result = spawnSync(command, args);
    if(result.status == 0) {
        core.info(`Ok out: ${result.stdout.toString()} err: ${result.stderr.toString()}`);
        return 0;
    } else {
        core.error(`${command} failed`);
        core.error(`${result.stderr.toString()}`);
        core.error(`${result.stdiout.toString()}`);
        return 1;
    }
}

function wait_for_minikube() {
    var i = 0;
    var command = 'kubectl';
    var args = ['create', 'clusterrolebinding', 'add-on-cluster-admin', '--clusterrole=cluster-admin', '--serviceaccount=kube-system:default'];

    while(i < 60) {
        if (execute_command(command, args) == 0) {
            return 0;
        } else {
            sleep(1000).then(() => {
                core.info("Minikube is not ready yet.");
            });
        }
    }
    core.setFailed("Minikube failed to start or RBAC could not be properly set up");
}

function install_minikube() {
    const minikubeVersion = core.getInput('minikube-version');
    core.info(`Downloading Minikube...`);
    var kubeDownCommand = 'curl';
    var kubeDownArgs = ['-LO', `https://storage.googleapis.com/minikube/releases/latest/minikube_${minikubeVersion}.deb`];
    if (execute_command(kubeDownCommand, kubeDownArgs) == 1) return 1;

    core.info(`Installing Minikube...`);
    var kubeInstallCommand = 'sudo';
    var kubeInstallArgs = ['dpkg', '-i', `minikube_${minikubeVersion}.deb`];
    return execute_command(kubeInstallCommand, kubeInstallArgs);
}

function run_registry() {
    core.info(`Running registry...`);
    var registryCommand = 'docker';
    var registryArgs = ['run', '--name', 'image-registry', '-d', '-p', '5000:5000', '--restart=always', 'registry'];
    return execute_command(registryCommand, registryArgs);
}

function run_docker_ps() {
/*
    core.info(`Running docker ps...`);
    var registryCommand = 'docker';
    var registryArgs = ['ps', '--all'];
    return execute_command(registryCommand, registryArgs);
*/
   return 0;
}

function run_logs() {
/*
    sleep(5).then(() => {
        core.info(`Running docker image-registry logs...`);
        var registryCommand = 'docker';
        var registryArgs = ['logs', 'image-registry'];
        execute_command(registryCommand, registryArgs);
        core.info(`Run docker logs...`);
   });
*/
   return 0;
}

function start_minikube() {
    const kubernetesVersion = core.getInput('k8s-version');
    core.exportVariable('CHANGE_MINIKUBE_NONE_USER', 'true');
    var startCommand = 'sudo';
    var startArgs = ['-E', 'minikube', 'start', '--vm-driver=none', '--kubernetes-version',
    `v${kubernetesVersion}`, '--insecure-registry=localhost:5000', '--extra-config=kubeadm.ignore-preflight-errors=SystemVerification', '--extra-config=apiserver.authorization-mode=RBAC']
    if(execute_command(startCommand, startArgs) == 1) return 1;
    
    var addonsCommand = 'sudo';
    var addonsArgs = ['-E', 'minikube', 'addons', 'enable', 'default-storageclass'];
    return execute_command(addonsCommand, addonsArgs);
}

try {
    if (install_minikube() || run_registry() || start_minikube() || wait_for_minikube() || run_docker_ps() || run_logs()) {
        core.info(`pipeline failed`);
        core.setFailed(error.message);    
    }
    
} catch (error) {
    core.info(`pipeline failed` + error);
    core.setFailed(error.message);
}
