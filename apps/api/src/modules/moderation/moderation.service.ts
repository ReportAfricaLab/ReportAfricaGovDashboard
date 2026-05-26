import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RekognitionService } from '../rekognition/rekognition.service';

export interface ModerationResult {
  isApproved: boolean;
  flags: string[];
  confidence: number;
  suggestedVerification: string;
  aiSummary?: string;
  aiHeadline?: string;
}

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);
  private readonly openaiKey: string;

  constructor(
    private readonly config: ConfigService,
    private readonly rekognition: RekognitionService,
  ) {
    this.openaiKey = this.config.get('OPENAI_API_KEY', '');
  }

  async moderateReport(title: string, description: string, category: string): Promise<ModerationResult> {
    // If no API key, use rule-based moderation
    if (!this.openaiKey) {
      return this.ruleBasedModeration(title, description);
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.openaiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a content moderation AI for ReportAfrica, a citizen journalism platform. Analyze reports for:
1. Fake/misleading content
2. Hate speech or incitement
3. Spam or irrelevant content
4. Dangerous misinformation
5. Credibility assessment

Also generate a news headline and brief summary.

Respond in JSON: { "isApproved": boolean, "flags": string[], "confidence": 0-1, "suggestedVerification": "unverified"|"ai_verified", "aiHeadline": string, "aiSummary": string }`
            },
            { role: 'user', content: `Category: ${category}\nTitle: ${title}\nDescription: ${description}` }
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' },
        }),
      });

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);
      this.logger.log(`Moderation result for "${title}": approved=${result.isApproved}, confidence=${result.confidence}`);
      return result;
    } catch (error) {
      this.logger.error('AI moderation failed, falling back to rule-based', error);
      return this.ruleBasedModeration(title, description);
    }
  }

  async generateHeadline(title: string, description: string): Promise<string> {
    if (!this.openaiKey) return title;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.openaiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Generate a concise breaking news headline from this citizen report. Max 100 characters. No quotes.' },
            { role: 'user', content: `${title}\n${description}` }
          ],
          temperature: 0.3,
          max_tokens: 50,
        }),
      });

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch {
      return title;
    }
  }

  private ruleBasedModeration(title: string, description: string): ModerationResult {
    const flags: string[] = [];
    const text = `${title} ${description}`.toLowerCase();

    const spamPatterns = ['buy now', 'click here', 'free money', 'whatsapp me', 'dm me'];
    const hatePatterns = ['kill all', 'death to'];
    const suspiciousPatterns = ['i heard that', 'someone told me', 'rumor has it'];

    spamPatterns.forEach((p) => { if (text.includes(p)) flags.push('spam'); });
    hatePatterns.forEach((p) => { if (text.includes(p)) flags.push('hate_speech'); });
    suspiciousPatterns.forEach((p) => { if (text.includes(p)) flags.push('unverified_claim'); });

    if (text.length < 20) flags.push('low_quality');

    return {
      isApproved: flags.length === 0,
      flags,
      confidence: flags.length === 0 ? 0.7 : 0.5,
      suggestedVerification: flags.length === 0 ? 'unverified' : 'unverified',
    };
  }

  async moderateImage(s3Key: string): Promise<{ isApproved: boolean; flags: string[] }> {
    const result = await this.rekognition.moderateImage(s3Key);
    this.logger.log(`Image moderation for ${s3Key}: approved=${result.isApproved}, flags=${result.flags.join(',')}`);
    return { isApproved: result.isApproved, flags: result.flags };
  }
}
