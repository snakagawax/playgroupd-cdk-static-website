import { aws_s3, aws_s3_deployment, aws_iam, Stack, StackProps, RemovalPolicy, aws_cloudfront } from 'aws-cdk-lib';
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface MaintenanceSiteStackProps extends StackProps {
    accountId: string;
}

export class MaintenanceSiteStack extends Stack {
    public readonly maintenanceBucket: aws_s3.IBucket;

    constructor(scope: Construct, id: string, props: MaintenanceSiteStackProps) {
        super(scope, id, props);

        // S3バケットの作成
        this.maintenanceBucket = new Bucket(this, 'MaintenanceBucket', {
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
            removalPolicy: RemovalPolicy.DESTROY
        });
        new aws_s3_deployment.BucketDeployment(this, 'DeployMaintenanceContent', {
            sources: [aws_s3_deployment.Source.asset('./maintenance-content')],
            destinationBucket: this.maintenanceBucket,
        });
    }
}