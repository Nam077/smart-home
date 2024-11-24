export enum CommandTypeEnum {
    // Broadcast Commands
    TURN_OFF_ALL = 'turn_off_all',
    TURN_ON_ALL = 'turn_on_all',

    // Connection Commands
    DEVICE_CONNECT = 'device_connect',
    DEVICE_DISCONNECT = 'device_disconnect',

    // Unicast Commands
    SET_STATUS = 'set_status',
    SET_BRIGHTNESS = 'set_brightness',
    SET_SPEED = 'set_speed',
    SET_TEMPERATURE = 'set_temperature',
    SET_VALUE = 'set_value',
    GET_STATUS = 'get_status',
    GET_INFO = 'get_info',

    // Config Commands
    UPDATE_CONFIG = 'update_config',
    SYNC_TIME = 'sync_time',
}

export enum TopicTypeEnum {
    BROADCAST = 'broadcast',
    CONTROL = 'control',
    CONFIG = 'config',
    STATUS = 'status',
    DATA = 'data',
    ERROR = 'error',
}

export interface IBaseMessage {
    timestamp: string;
}

export interface ICommandMessage extends IBaseMessage {
    command: CommandTypeEnum;
    value?: any;
}

export interface IStatusMessage extends IBaseMessage {
    status: string;
    brightness?: number;
    speed?: number;
    temperature?: number;
    value?: number;
    error?: string;
}

export interface IConfigMessage extends IBaseMessage {
    updateInterval?: number;
    threshold?: number;
}
