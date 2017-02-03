import {EventEmitter} from 'events'
const request = require('request')

interface LibratoClientConfig {
  email: string,
  token: string,
  prefix?: string,
  period?: number,
}

interface IncrementOptions {
  amount?: number,
  sporadic?: true,
  source?: string
}

// old-style metrics
interface Gauge {
  name: string,
  value: number,
  period: number,
  source?: string,
  attributes?: MetricAttributes,
}

interface MultiSampleGauge {
  name: string,
  count: number,
  sum: number,
  max: number,
  min: number,
  sum_squares: number,
  period: number,
  source?: string,
  attributes?: MetricAttributes,
}

interface Credentials {
  user: string,
  pass: string,
}

interface MetricAttributes {
  aggregate?: boolean,
  summarize_function?: string,
}

const endpoint = 'https://metrics-api.librato.com/v1'

async function postToLibrato(
  creds : Credentials, gauges : Array<Gauge|MultiSampleGauge>
) {
  let body = {
    gauges: gauges,
  }
  const options = {
    method: 'POST',
    uri: `${endpoint}/metrics`,
    auth: creds,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }
  request(options, (err, resp, body) => {
    console.log('done', resp.statusCode, body)
  })

}

export class LibratoClient extends EventEmitter {
  config: LibratoClientConfig

  protected counters : Object
  protected interval : NodeJS.Timer
  protected period : number
  protected sporadics : Set<string>
  protected creds : Credentials

  constructor(config : LibratoClientConfig) {
    super()
    this.config = config
    this.creds = {
      user: this.config.email,
      pass: this.config.token,
    }
    this.period = config.period || 60000
    this.counters = {}
    this.sporadics = new Set()


  }

  start() {
    this.interval = setInterval(() => {
      this.submitMetrics()
    }, this.config.period)
  }

  submitMetrics() {
    this.submitCounters()
    this.resetCounters()
  }

  submitCounters() {
    const gauges : Gauge[] = []

    const attributes : MetricAttributes = {
      aggregate: true,
      summarize_function: 'sum',
    }

    for(let metric in this.counters) {
      gauges.push({
        name: metric,
        value: this.counters[metric],
        period: this.period/1000,
        attributes: attributes,
      })
    }
    postToLibrato(this.creds, gauges)
  }

  resetCounters() {
    for(let metric in this.sporadics.entries()) {
      delete this.counters[metric]
    }
    this.sporadics = new Set()

    for(let metric in this.counters) {
      this.counters[metric] = 0
    }
  }

  stop() {
    clearInterval(this.interval)
  }

  /*
    For reference: https://github.com/librato/librato-rack/blob/master/lib/librato/collector/counter_cache.rb
  */
  increment(metric : string, options? : IncrementOptions) {
    const amount = options.amount || 1
    const metricName = (this.config.prefix || '') + metric
    const newCount = (this.counters[metricName] || 0) + amount
    if(options.sporadic) {
      this.sporadics.add(metricName)
    }
    this.counters[metricName] = newCount
  }

}
