#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MainStack } from '../lib/static_main-stack';
import { MaintenanceSiteStack } from '../lib/static_maintenance-stack';

const app = new cdk.App();
new MainStack(app, 'StaticSiteStack', {
  accountId: process.env.CDK_DEFAULT_ACCOUNT!
});
new MaintenanceSiteStack(app, 'MaintenanceSiteStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT!,
    region: 'us-west-2'
  },
  accountId: process.env.CDK_DEFAULT_ACCOUNT!
});