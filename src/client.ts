import {EventEmitter} from 'events'
import * as R from 'ramda'
const request = require('request')

const max = R.reduce(R.max, -Infinity)
const min = R.reduce(R.min, Infinity)

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
  protected gauges : Object
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
    this.gauges = {}
    this.sporadics = new Set()


  }

  start() {
    this.interval = setInterval(() => {
      this.submitMetrics()
    }, this.config.period)
  }

  submitMetrics() {
    this.submitGauges()
    this.resetGauges()

    this.submitCounters()
    this.resetCounters()
  }

  submitGauges() {
    const gauges : MultiSampleGauge[] = []
    const attributes : MetricAttributes = {
      aggregate: true,
      summarize_function: 'average', // good guess
    }

    for(let metric in this.gauges) {
      const measurements = this.gauges[metric]
      gauges.push({
        name: metric,
        count: measurements.length,
        sum: R.sum(measurements),
        max: max(measurements),
        min: min(measurements),
        sum_squares: R.sum(R.map((x) => {return x * x})(measurements)),
        period: this.period/1000,
        attributes: attributes,
      })
    }
    postToLibrato(this.creds, gauges)
  }

  resetGauges() {
    this.gauges = {}
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

  fullMetric(metric) {
    return (this.config.prefix || '') + metric
  }

  /*
    For reference:
    https://github.com/librato/librato-rack/blob/master/lib/librato/collector/counter_cache.rb
  */
  increment(metric : string, options? : IncrementOptions) {
    const amount = options.amount || 1
    const metricName = this.fullMetric(metric)
    const newCount = (this.counters[metricName] || 0) + amount
    if(options.sporadic) {
      this.sporadics.add(metricName)
    }
    this.counters[metricName] = newCount
  }

  measure(metric : string, value : number) {
    const metricName = this.fullMetric(metric)
    this.gauges[metricName] = this.gauges[metricName] || []
    this.gauges[metricName].push(value)
  }


}
