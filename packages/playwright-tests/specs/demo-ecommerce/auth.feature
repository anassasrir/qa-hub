# language: fr
@demo-ecommerce @auth @security
Fonctionnalité: Authentification et contrôle d'accès

  Scénario: Connexion réussie avec des identifiants valides
    Étant donné que l'utilisateur est sur la page de connexion
    Quand il saisit une adresse email valide
    Et qu'il saisit son mot de passe
    Et qu'il clique sur "Se connecter"
    Alors il est redirigé vers le tableau de bord client

  Scénario: Échec de connexion avec un mot de passe incorrect
    Étant donné que l'utilisateur est sur la page de connexion
    Quand il saisit un mot de passe incorrect
    Et qu'il clique sur "Se connecter"
    Alors une notification d'erreur s'affiche
