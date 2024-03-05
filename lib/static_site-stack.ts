import { aws_cloudfront, aws_cloudfront_origins, aws_iam, aws_s3, aws_s3_deployment, Stack, StackProps } from 'aws-cdk-lib';
import { BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface SubStackProps extends StackProps {
  accountId: string;
}

export class FrontendStack extends Stack {

  public readonly contentsBucket: aws_s3.IBucket;
  public readonly distribution: aws_cloudfront.IDistribution;

  constructor(scope: Construct, id: string, props: SubStackProps) {
    super(scope, id, props);

    // S3
    this.contentsBucket = new aws_s3.Bucket(this, 'ContentsBucket', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });

    // OAC
    // https://github.com/aws/aws-cdk/issues/21771
    const cfnOriginAccessControl = new aws_cloudfront.CfnOriginAccessControl(this, 'OriginAccessControl', {
      originAccessControlConfig: {
        name: 'OriginAccessControlForContentsBucket',
        originAccessControlOriginType: 's3',
        signingBehavior: 'always',
        signingProtocol: 'sigv4',
        description: 'Access Control',
      },
    });

    // CloudFront
    this.distribution = new aws_cloudfront.Distribution(this, 'Distribution', {
      comment: 'distribution.',
      defaultBehavior: {
        origin: new aws_cloudfront_origins.S3Origin(this.contentsBucket),
        allowedMethods: aws_cloudfront.AllowedMethods.ALLOW_ALL,
      },
      defaultRootObject: 'index.html',
      httpVersion: aws_cloudfront.HttpVersion.HTTP2_AND_3,
    });

    const cfnDistribution = this.distribution.node.defaultChild as aws_cloudfront.CfnDistribution;
    // OAI削除（勝手に設定されるため）
    cfnDistribution.addPropertyOverride('DistributionConfig.Origins.0.S3OriginConfig.OriginAccessIdentity', '');
    // OAC設定
    cfnDistribution.addPropertyOverride('DistributionConfig.Origins.0.OriginAccessControlId', cfnOriginAccessControl.attrId);

    // S3 - BucketPolicy
    const contentsBucketPolicyStatement = new aws_iam.PolicyStatement({
      actions: ['s3:GetObject'],
      effect: aws_iam.Effect.ALLOW,
      principals: [
        new aws_iam.ServicePrincipal('cloudfront.amazonaws.com'),
      ],
      resources: [`${this.contentsBucket.bucketArn}/*`],
    });
    contentsBucketPolicyStatement.addCondition('StringEquals', {
      'AWS:SourceArn': `arn:aws:cloudfront::${props.accountId}:distribution/${this.distribution.distributionId}`
    })
    this.contentsBucket.addToResourcePolicy(contentsBucketPolicyStatement);

    // S3バケットにwebsite-contentディレクトリのindex.htmlをデプロイ
    new aws_s3_deployment.BucketDeployment(this, 'DeployWithIndexHtml', {
      sources: [aws_s3_deployment.Source.asset('./website-content')],
      destinationBucket: this.contentsBucket,
      // CloudFrontのキャッシュをクリアするためにdistributionを指定する
      distribution: this.distribution,
      distributionPaths: ['/index.html'],
    });
  }

}

