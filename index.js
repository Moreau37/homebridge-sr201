const net = require('net');

const { Accessory, uuid, Service: HAPService, Characteristic: HAPCharacteristic } = require('homebridge');

module.exports = (api) => {
  api.registerAccessory('homebridge-sr201netrelay', 'SR201NetRelay', SR201NetRelayAccessory);
} 

class SR201NetRelayAccessory {
  constructor(log, config, api) {
    this.log = log;
    this.config = config;

    this.index = parseInt(this.config.index);
    if ( (this.index < 1) || this.index > 8 )
    {
        log('index parameter must be within [1;8], value is: ' + this.index);
        return;
    }

    this.address = this.config.address;
    this.port = 6722;

    if (this.config.pulse == false)
    { 
         this.service = new HAPService.StatelessProgrammableSwitch(this.config.name);
    }
    else
    {
	this.service = new HAPService.Switch(this.config.name);
    }

    this.client = new net.Socket();
    this.client.on('data', this.handleData.bind(this));
    this.client.on('close', this.handleClose.bind(this));
    this.client.on('error', this.handleError.bind(this));
    this.connect();
  }

  getServices()
  {
     /* Create a new information service. This just tells HomeKit about our accessory. */
    const informationService = new Service.AccessoryInformation()
        .setCharacteristic(Characteristic.Manufacturer, 'No idea')
        .setCharacteristic(Characteristic.Model, 'SR201NetRelay')
        .setCharacteristic(Characteristic.SerialNumber, 'Unspecified');

    if (this.config.pulse == false)
    {
	this.service.getCharacteristic(Characteristic.ProgrammableSwitchEvent)
             .on('set', this.handleSwitchEvent.bind(this));
    }
    else
    {
	this.service.getCharacteristic(Characteristic.On)
             .on('get', this.handleSwitchEvent.bind(this))
             .on('set', this.handleSwitchEvent.bind(this))
    }

    /* Return both the main service (this.service) and the informationService */
    return [informationService, this.service]
  }

  connect() {
    this.client.connect(this.port, this.host, () => {
      this.log('TCP connection established.');
    });
  }

  handleData(data) {
    // Handle the received data here
    this.log('Received data:', data.toString());
  }

  handleClose() {
    this.log('TCP connection closed. Reconnecting...');
    this.connect();
  }

  handleError(error) {
    this.log.error('TCP connection error:', error);
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
      this.log('TCP connection timeout or reset. Reconnecting...');
      this.connect();
    }
  }

  handleSwitchEvent(value, callback) {
    var message;
    if (config.pulse == true) 
    {
        if (value === Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS) {
            message = '1${index}*';
            this.sendUDPMessage(message);
        }
    }
    else
    {
        if (value == true)
        {
            message = '1${index}';
        }
        else
        {
            message = '2${index}';
        }
        this.sendUDPMessage(message);
    }
    callback(null);
  }

  sendTCPMessage(message) {
    if (this.client.writable) {
      this.client.write(message);
    } else {
      this.log('TCP client is not writable. Reconnecting...');
      this.connect();
    }
  }

  getServices() {
    return [this.accessory];
  }
}



