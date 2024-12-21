import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { VoiceControllerService } from './voice-controller.service';

describe('VoiceControllerService', () => {
    let service: VoiceControllerService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [VoiceControllerService],
        }).compile();

        service = module.get<VoiceControllerService>(VoiceControllerService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
