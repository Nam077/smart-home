import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { VoiceControllerController } from './voice-controller.controller';
import { VoiceControllerService } from './voice-controller.service';

describe('VoiceControllerController', () => {
    let controller: VoiceControllerController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [VoiceControllerController],
            providers: [VoiceControllerService],
        }).compile();

        controller = module.get<VoiceControllerController>(VoiceControllerController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
