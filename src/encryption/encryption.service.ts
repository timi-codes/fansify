import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  /**
   * Generates a hash from the password
   *
   * @param plainText the user's password
   * @param saltRounds the number of rounds to use when creating the hash
   * @returns A hash string.
   */
  public generateHash(plainText: string, saltRounds = 10): string {
    try {
      const salt = bcrypt.genSaltSync(saltRounds);

      const hash = bcrypt.hashSync(plainText, salt);

      return hash;
    } catch (error) {
      console.error('Generating hash failed.');
      throw new Error(`generateHash: ${error}`);
    }
  }

  /**
   * Compare a plaintext against a hash
   *
   * @param plainText the plaintext to compare
   * @param hash the hash to compare against
   */
  public compareHash(plainText: string, hash: string): boolean {
    try {
      return bcrypt.compareSync(plainText, hash);
    } catch (error) {
      console.error('Compare hash failed.');
      throw new Error(`compareHash: ${error}`);
    }
  }

  /**
   * Encrypts a string
   *
   * @param text the text to encrypt
   * @param key the key to use for encryption
   */
  public encrypt(text: string, key: Buffer): string {
    try {
      const iv = crypto.randomBytes(16); // Generate a random initialization vector
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return encrypted;
    } catch (error) {
      console.error('Encrypt failed.');
      throw new Error(`encrypt: ${error}`);
    }
  }

  /**
   * Decrypts a string
   *
   * @param text the text to decrypt
   * @param key the key to use for decryption
   */
  public decrypt(text: string, key: Buffer): string {
    try {
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.alloc(16, 0));
      let decrypted = decipher.update(text, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Decrypt failed.');
      throw new Error(`decrypt: ${error}`);
    }
  }
}
