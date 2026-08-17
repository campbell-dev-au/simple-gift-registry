Feature: Invite a co-owner to a gift registry
  As a registry owner
  I want to invite another person to help manage my registry
  So that we can share the work, without either of us seeing who claimed what

  @registry
  Scenario: Owner invites another person by email
    Given I am already signed in
    And I have created a gift registry
    When I view the registry
    And I invite "friend@example.com" as a co-owner
    Then I see "friend@example.com" listed as a pending invitation

  @registry
  Scenario: Owner cancels a pending invitation
    Given I am already signed in
    And I have created a gift registry
    And I have invited "friend@example.com" as a co-owner
    When I view the registry
    And I cancel the invitation to "friend@example.com"
    Then I do not see "friend@example.com" listed as a pending invitation

  @registry
  Scenario: Invited person accepts and gains management access
    Given someone has invited me to co-own their gift registry
    And I am already signed in
    When I view my registries
    And I accept the invitation
    Then I see the registry in my registries list
    And I can edit the registry

  @registry
  Scenario: Invited person declines the invitation
    Given someone has invited me to co-own their gift registry
    And I am already signed in
    When I view my registries
    And I decline the invitation
    Then I do not see the registry in my registries list

  @registry
  Scenario: An accepted co-owner can invite another co-owner
    Given I am a co-owner of someone else's gift registry
    And I am already signed in
    When I view the registry
    And I invite "another-friend@example.com" as a co-owner
    Then I see "another-friend@example.com" listed as a pending invitation

  @registry
  Scenario: The original owner removes a co-owner
    Given I am already signed in
    And I have created a gift registry
    And another person has accepted my co-owner invitation
    When I view the registry
    And I remove that co-owner
    Then I do not see them listed as a co-owner

  @registry
  Scenario: A co-owner cannot remove another co-owner
    Given I am a co-owner of someone else's gift registry
    And I am already signed in
    When I view the registry
    Then I do not see a way to remove a co-owner

  @registry
  Scenario: A co-owner sees the original owner listed, not themselves
    Given I am a co-owner of a registry owned by another real account
    And I am already signed in
    When I view the registry
    Then I see the owner's email listed as a co-owner
    And I do not see my own email listed as a co-owner
