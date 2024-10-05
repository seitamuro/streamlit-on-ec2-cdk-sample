import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class StreamlitOnEc2CdkSampleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "StreamlitOnEc2Vpc", {
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "StreamlitOnEc2PublicSubnet",
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    const securityGroup = new ec2.SecurityGroup(
      this,
      "StreamlitOnEc2SecurityGroup",
      {
        vpc: vpc,
        allowAllOutbound: true,
      }
    );
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80));

    const ec2Instance = new ec2.Instance(this, "StreamlitOnEc2Instance", {
      instanceType: new ec2.InstanceType("t2.micro"),
      machineImage: new ec2.AmazonLinuxImage(),
      vpc: vpc,
      securityGroup: securityGroup,
      userData: ec2.UserData.custom(`
        sudo yum install git python3.11 python3.11-pip iptables -y
        git clone https://github.com/seitamuro/streamlit-on-ec2-cdk-sample.git
        mv streamlit-on-ec2-cdk-sample/app/* .
        python3.11 -m pip install -r requirements.txt
        sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8080
        streamlit hello --server.port 8080
      `),
    });

    new cdk.CfnOutput(this, "StreamlitOnEc2InstancePublicDnsName", {
      value: ec2Instance.instancePublicDnsName,
    });
  }
}
