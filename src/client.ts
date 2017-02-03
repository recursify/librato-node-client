import {EventEmitter} from 'events'

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
  tags?: Object
}

interface Measurement {
  name: string,
  value: number,
}

function postToLibrato(measurements : Measurement[]) {
  for(let m in measurements) {
    console.log(m)
  }
}

export class LibratoClient extends EventEmitter {
  config: LibratoClientConfig

  protected counters : Object
  protected interval : NodeJS.Timer
  protected period : number
  protected sporadics : Set<string>

  constructor(config : LibratoClientConfig) {
    super()
    this.config = config
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
    console.log('flushing', this.counters)
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
