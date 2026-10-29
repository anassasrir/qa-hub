# language: fr
@demo-ecommerce @smoke @p0
Fonctionnalité: Chargement et disponibilité de la boutique démo

  Scénario: vérifie le chargement de la page d’accueil et les éléments de base
    Étant donné que l'utilisateur accède à la boutique démo
    Quand la page d'accueil est chargée
    Alors le titre de la page contient "Demo Store QA Hub"
    Et le logo de la marque est visible
    Et le bouton de connexion est disponible
    Et le badge du panier est initialisé
