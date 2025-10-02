import TransportStream from "winston-transport";
import type { TransportStreamOptions } from "winston-transport";
import {
  CloudWatchLogsClient,
  CreateLogGroupCommand,
  CreateLogStreamCommand,
  PutLogEventsCommand,
  DescribeLogStreamsCommand,
} from "@aws-sdk/client-cloudwatch-logs";

interface CloudWatchTransportOptions extends TransportStreamOptions {
  logGroupName: string;
  logStreamName: string;
  region?: string;
}

export default class CloudWatchTransport extends TransportStream {
  private cloudwatch: CloudWatchLogsClient;
  private logGroupName: string;
  private logStreamName: string;
  private sequenceToken: string | undefined;
  private initialized = false;

  constructor(options: CloudWatchTransportOptions) {
    super(options);
    this.logGroupName = options.logGroupName;
    this.logStreamName = options.logStreamName;
    this.cloudwatch = new CloudWatchLogsClient({
      region: options.region || "ap-south-1",
    });
  }

  async log(info: any, callback: () => void) {
    setImmediate(() => this.emit("logged", info));

    try {
      if (!this.initialized) {
        await this.setupCloudWatch();
      }

      const logEvent = {
        message:
          typeof info.message === "object"
            ? JSON.stringify(info.message)
            : info.stack || info.message,
        timestamp: Date.now(),
      };

      const putCommand = new PutLogEventsCommand({
        logGroupName: this.logGroupName,
        logStreamName: this.logStreamName,
        logEvents: [logEvent],
        sequenceToken: this.sequenceToken,
      });

      const result = await this.cloudwatch.send(putCommand);
      this.sequenceToken = result.nextSequenceToken;
    } catch (error) {
      console.error("❌ CloudWatch logging error:", error);
    }

    callback();
  }

  private async setupCloudWatch() {
    try {
      await this.cloudwatch.send(
        new CreateLogGroupCommand({ logGroupName: this.logGroupName })
      );
    } catch (_) {}

    try {
      await this.cloudwatch.send(
        new CreateLogStreamCommand({
          logGroupName: this.logGroupName,
          logStreamName: this.logStreamName,
        })
      );
    } catch (_) {}

    const describeStreams = await this.cloudwatch.send(
      new DescribeLogStreamsCommand({
        logGroupName: this.logGroupName,
        logStreamNamePrefix: this.logStreamName,
      })
    );

    const stream = describeStreams.logStreams?.[0];
    this.sequenceToken = stream?.uploadSequenceToken;
    this.initialized = true;
  }
}
