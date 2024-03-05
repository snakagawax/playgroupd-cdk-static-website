#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { FrontendStack } from '../lib/static_site-stack';

const app = new cdk.App();
new FrontendStack(app, 'StaticSiteStack', {
  accountId: process.env.CDK_DEFAULT_ACCOUNT!
});