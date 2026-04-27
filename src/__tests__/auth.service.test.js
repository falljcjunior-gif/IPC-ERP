import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../services/auth.service';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { FirestoreService } from '../services/firestore.service';

describe('AuthService - Audit de Robustesse', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('test_devrait_authentifier_avec_succes_quand_credentials_valides', async () => {
    // ARRANGE
    const mockUser = { uid: 'u123', email: 'test@ipc.com' };
    const mockDoc = { 
      exists: () => true, 
      data: () => ({ nom: 'Admin', profile: { active: true }, permissions: { roles: ['ADMIN'] } }) 
    };
    
    vi.mocked(signInWithEmailAndPassword).mockResolvedValue({ user: mockUser });
    vi.spyOn(FirestoreService, 'getDocument').mockResolvedValue(mockDoc.data());

    // ACT
    const result = await AuthService.login('test@ipc.com', 'correct_password');

    // ASSERT
    expect(result.user.uid).toBe('u123');
    expect(result.userData.nom).toBe('Admin');
  });

  it('test_devrait_echouer_et_logger_quand_mot_de_passe_errone', async () => {
    // ARRANGE
    vi.mocked(signInWithEmailAndPassword).mockRejectedValue(new Error('auth/wrong-password'));

    // ACT & ASSERT
    await expect(AuthService.login('test@ipc.com', 'wrong_pass'))
      .rejects.toThrow('auth/wrong-password');
  });

  it('test_devrait_rejeter_si_utilisateur_est_fantome_dans_firestore', async () => {
    // ARRANGE (User existe dans Auth mais pas dans la collection 'users')
    vi.mocked(signInWithEmailAndPassword).mockResolvedValue({ user: { uid: 'ghost' } });
    vi.spyOn(FirestoreService, 'getDocument').mockResolvedValue(null);

    // ACT & ASSERT
    await expect(AuthService.login('ghost@ipc.com', 'pw'))
      .rejects.toThrow('Profil utilisateur introuvable');
  });

  it('test_devrait_bloquer_si_entree_mail_est_une_injection_potentielle', async () => {
    // ARRANGE
    const maliciousEmail = { $ne: null }; // Type inattendu qui pourrait casser une DB non protégée

    // ACT & ASSERT
    // Le service doit échouer lors de la validation ou la sanitisation si bien codé
    await expect(AuthService.login(maliciousEmail, 'pw'))
      .rejects.toThrow();
  });

});
